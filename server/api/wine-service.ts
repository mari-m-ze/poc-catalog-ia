import { WineAttributes, WineInput } from "../domain/wine";
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

export async function processWineCSV(fileBuffer: Buffer): Promise<{ attributes: WineAttributes[]; inputPath: string; outputPath: string }> {
  try {
    // Parse CSV content
    const records = parse(fileBuffer, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true
    });

    // Create temporary directory for this processing session
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wine-processing-'));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const inputPath = path.join(tempDir, `input-${timestamp}.csv`);
    const outputPath = path.join(tempDir, `output-${timestamp}.csv`);

    // Save input CSV
    fs.writeFileSync(inputPath, fileBuffer);

    // Transform and validate CSV records
    const wineInputs: WineInput[] = records.map((record: any) => {
      const input = {
        id: record.id || '',
        nome: record.title || record.nome || '',
        description: record.description || ''
      };
      if (!input.nome) {
        throw new Error('CSV must contain either a "title" or "nome" column for each record');
      }
      return input;
    });

    // Process each wine input individually and collect results
    const results: WineAttributes[] = [];
    for (const input of wineInputs) {
      const provider = config.getAIProvider();
      let result: WineAttributes;
      switch (provider) {
        case "openai":
          result = await openai.generateWineAttribute(input);
          break;
        case "anthropic":
          // result = await anthropic.generateWineAttribute(input);
          throw new Error("Anthropic provider not implemented yet");
        case "gemini":
          result = await gemini.generateWineAttribute(input);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
      results.push(result);
    }
    // Save output CSV
    const outputCsv = generateWineAttributesCSV(results);
    fs.writeFileSync(outputPath, outputCsv);

    return {
      attributes: results,
      inputPath,
      outputPath
    };
  } catch (error) {
    console.error('Error processing wine CSV:', error);
    throw error;
  } finally {
    // Store tempDir for cleanup
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wine-processing-'));
    
    // Clean up temporary files after 1 hour
    setTimeout(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temporary directory: ${tempDir}`);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary files:', cleanupError);
      }
    }, 60 * 60 * 1000); // 1 hour
  }
}

export function generateWineAttributesCSV(attributes: WineAttributes[]): Buffer {
  // Transform attributes to flat CSV structure
  const records = attributes.map(attr => ({
    id: attr.id,
    nome: attr.nome,
    status: attr.status,
    pais: attr.pais.value,
    pais_confidence: attr.pais.confidence,
    tipo: attr.tipo.value,
    tipo_confidence: attr.tipo.confidence,
    classificacao: attr.classificacao.value,
    classificacao_confidence: attr.classificacao.confidence,
    uva: attr.uva.value,
    uva_confidence: attr.uva.confidence,
    tamanho: attr.tamanho.value,
    tamanho_confidence: attr.tamanho.confidence,
    tampa: attr.tampa.value,
    tampa_confidence: attr.tampa.confidence,
    harmonizacao: attr.harmonizacao.values.join('; '),
    harmonizacao_confidence: attr.harmonizacao.confidence,
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
