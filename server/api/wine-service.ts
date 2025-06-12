import { calculateOverallConfidence, WineAttributes, WineInput } from "../domain/wine";
import * as openai from "../ai/openai";
import * as anthropic from "../ai/anthropic";
import * as gemini from "../ai/gemini";
import { config } from "../config";
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { db } from "../db";
import { wine_enrichment, wine_enrichment_execution, type InsertWineEnrichment, type InsertWineEnrichmentExecution } from "../../shared/schema-catalog-wine";
import { eq } from "drizzle-orm";

type ProcessingResult = {
  attributes: WineAttributes[];
  inputPath: string;
  outputPath: string;
  executionId: number;
  stats: {
    total: number;
    successful: number;
    failed: number;
  };
};

export async function generateWineAttributes(produtos: WineInput | WineInput[]): Promise<WineAttributes | WineAttributes[]> {
  let selectedProvider = config.getAIProvider();

  if (!config.hasRequiredAPIKey(selectedProvider)) {
    console.warn(`API key not configured for provider: ${selectedProvider}, falling back to OpenAI`);
    selectedProvider = "openai";
  }
  const produtosArray = Array.isArray(produtos) ? produtos : [produtos];
  let result: WineAttributes[];

  switch (selectedProvider) {
    case "openai":
      result = await openai.generateWineAttributes(produtosArray);
      break;
    case "anthropic":
      result = await anthropic.generateWineAttributes(produtosArray);
      break;
    case "gemini":
      result = await gemini.generateWineAttributes(produtosArray);
      break;
  }

  return Array.isArray(produtos) ? result : result[0];
}

async function createExecutionRecord(provider: string): Promise<number> {
  const executionRecord: InsertWineEnrichmentExecution = {
    execution_date: new Date(),
    provider,
    status: "PENDING"
  };

  const [execution] = await db.insert(wine_enrichment_execution).values(executionRecord).returning();
  return execution.id;
}

async function updateExecutionStatus(executionId: number, status: "OK" | "ERROR"): Promise<void> {
  await db.update(wine_enrichment_execution)
    .set({ status })
    .where(eq(wine_enrichment_execution.id, executionId));
}

function parseCSVRecords(fileBuffer: Buffer): WineInput[] {
  const records = parse(fileBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map((record: any) => {
    const input = {
      id: record.id || '',
      title: record.title || record.nome || '',
      description: record.description || ''
    };
    
    if (!input.title) {
      throw new Error('CSV must contain either a "title" or "nome" column for each record');
    }
    
    return input;
  });
}

async function processWineWithAI(input: WineInput, provider: string): Promise<WineAttributes> {
  switch (provider) {
    case "openai":
      return await openai.generateWineAttribute(input);
    case "anthropic":
      throw new Error("Anthropic provider not implemented yet");
    case "gemini":
      return await gemini.generateWineAttribute(input);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function createEnrichmentRecord(
  executionId: number,
  input: WineInput,
  result: WineAttributes | null,
  provider: string,
  error: Error | null = null
): InsertWineEnrichment {
  const baseRecord = {
    id_execution: executionId,
    product_id: input.id && !isNaN(Number(input.id)) ? Number(input.id) : null,
    product_title: input.title,
    provider,
  };

  if (error) {
    return {
      ...baseRecord,
      country: null,
      country_confidence: null,
      type: null,
      type_confidence: null,
      classification: null,
      classification_confidence: null,
      grape_variety: null,
      grape_variety_confidence: null,
      size: null,
      size_confidence: null,
      closure: null,
      closure_confidence: null,
      pairings: null,
      pairings_confidence: null,
      status: "ERROR",
      error: error.message
    };
  }

  if (!result) {
    throw new Error("Result is required when no error is provided");
  }

  return {
    ...baseRecord,
    country: result.country.value,
    country_confidence: result.country.confidence,
    type: result.type.value,
    type_confidence: result.type.confidence,
    classification: result.classification.value,
    classification_confidence: result.classification.confidence,
    grape_variety: result.grape_variety.value,
    grape_variety_confidence: result.grape_variety.confidence,
    size: result.size.value,
    size_confidence: result.size.confidence,
    closure: result.closure.value,
    closure_confidence: result.closure.confidence,
    pairings: result.pairings.values.join('; '),
    pairings_confidence: result.pairings.confidence,
    status: "OK",
    error: null
  };
}

function createTempDirectory(provider: string): { tempDir: string; inputPath: string; outputPath: string } {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wine-processing-'));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    tempDir,
    inputPath: path.join(tempDir, `input-${provider}-${timestamp}.csv`),
    outputPath: path.join(tempDir, `output-${provider}-${timestamp}.csv`)
  };
}

function scheduleCleanup(tempDir: string, delayMs: number = 60 * 60 * 1000): void {
  setTimeout(() => {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temporary directory: ${tempDir}`);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }
  }, delayMs);
}

export async function processWineCSV(fileBuffer: Buffer): Promise<ProcessingResult> {
  let executionId: number | undefined;
  let tempDir: string | undefined;
  
  try {
    // Parse CSV content
    const wineInputs = parseCSVRecords(fileBuffer);
    
    // Get current AI provider
    const currentProvider = config.getAIProvider();

    // Create execution record
    executionId = await createExecutionRecord(currentProvider);

    // Create temporary directory and file paths
    const tempPaths = createTempDirectory(currentProvider);
    tempDir = tempPaths.tempDir;

    // Save input CSV
    fs.writeFileSync(tempPaths.inputPath, fileBuffer);

    // Process wines and collect results
    const results: WineAttributes[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < wineInputs.length; i++) {
      const input = wineInputs[i];
      console.log(`Processing wine ${i + 1}/${wineInputs.length}: "${input.title}"`);
      
      try {
        const result = await processWineWithAI(input, currentProvider);
        // Ensure confidence is calculated if not provided
        if (result.confidence === null || result.confidence === undefined) {
          result.confidence = calculateOverallConfidence(result);
        }
        results.push(result);
        
        const enrichmentRecord = createEnrichmentRecord(executionId, input, result, currentProvider);
        
        // Save individual record immediately
        await db.insert(wine_enrichment).values(enrichmentRecord);
        successCount++;
        
        console.log(`✅ Successfully processed wine ${i + 1}/${wineInputs.length}: "${input.title}"`);
        
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Error processing wine "${input.title}":`, errorObj);
        
        const enrichmentRecord = createEnrichmentRecord(executionId, input, null, currentProvider, errorObj);
        
        // Save error record immediately
        try {
          await db.insert(wine_enrichment).values(enrichmentRecord);
        } catch (dbError) {
          console.error(`Failed to save error record for "${input.title}":`, dbError);
        }
        
        failureCount++;
      }
    }
    
    // Update execution status
    const executionStatus = failureCount === 0 ? "OK" : "ERROR";
    await updateExecutionStatus(executionId, executionStatus);
    
    // Log final processing summary
    console.log(`\n🏁 Processing completed for execution ${executionId}:`);
    console.log(`   Total: ${wineInputs.length} wines`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📊 Success rate: ${((successCount / wineInputs.length) * 100).toFixed(1)}%`);
    
    // Generate and save output CSV
    const outputCsv = generateWineAttributesCSV(results);
    fs.writeFileSync(tempPaths.outputPath, outputCsv);

    // Schedule cleanup
    scheduleCleanup(tempDir);

    return {
      attributes: results,
      inputPath: tempPaths.inputPath,
      outputPath: tempPaths.outputPath,
      executionId,
      stats: {
        total: wineInputs.length,
        successful: successCount,
        failed: failureCount
      }
    };
    
  } catch (error) {
    console.error('Error processing wine CSV:', error);
    
    // Update execution status to ERROR if execution was created
    if (executionId) {
      try {
        await updateExecutionStatus(executionId, "ERROR");
      } catch (updateError) {
        console.error('Error updating execution status:', updateError);
      }
    }
    
    // Clean up temp directory immediately on error
    if (tempDir) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error cleaning up temporary files:', cleanupError);
      }
    }
    
    throw error;
  }
}

export function generateWineAttributesCSV(attributes: WineAttributes[]): Buffer {
  // Transform attributes to flat CSV structure
  const records = attributes.map(attr => ({
    id: attr.id,
    nome: attr.title,
    status: attr.status,
    pais: attr.country.value,
    pais_confidence: attr.country.confidence,
    tipo: attr.type.value,
    tipo_confidence: attr.type.confidence,
    classificacao: attr.classification.value,
    classificacao_confidence: attr.classification.confidence,
    uva: attr.grape_variety.value,
    uva_confidence: attr.grape_variety.confidence,
    tamanho: attr.size.value,
    tamanho_confidence: attr.size.confidence,
    tampa: attr.closure.value,
    tampa_confidence: attr.closure.confidence,
    harmonizacao: attr.pairings.values.join('; '),
    harmonizacao_confidence: attr.pairings.confidence,
  }));

  // Convert to CSV
  const csv = stringify(records, {
    header: true,
    columns: [
      'id',
      'nome',
      'status',
      'pais',
      'pais_confidence',
      'tipo',
      'tipo_confidence',
      'classificacao',
      'classificacao_confidence',
      'uva',
      'uva_confidence',
      'tamanho',
      'tamanho_confidence',
      'tampa',
      'tampa_confidence',
      'harmonizacao',
      'harmonizacao_confidence'
    ]
  });

  return Buffer.from(csv);
}
