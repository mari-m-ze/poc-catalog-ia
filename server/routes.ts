import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AppSettingsSchema, aiProviders } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { config } from "./config";
import { generateWineAttributes, processWineCSV, generateWineAttributesCSV } from "./api/wine-service";
import { analyzeExecutionAccuracy, generateAccuracyReportSummary } from "./api/wine-enrichment-statistcs";
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { generateWineAttributesSchema } from "../shared/wine-schema";
import { db } from "./db";
import { wine_enrichment, wine_enrichment_execution, products } from "../shared/schema-catalog-wine";
import { eq, sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {


  // AI Providers reference
  app.get("/api/reference/ai-providers", (_req: Request, res: Response) => {
    res.json(aiProviders);
  });

  // Settings API routes
  app.get("/api/settings", (_req: Request, res: Response) => {
    try {
      const settings = config.load();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  app.patch("/api/settings", (req: Request, res: Response) => {
    try {
      const updates = AppSettingsSchema.partial().parse(req.body);
      const newSettings = config.update(updates);
      res.json(newSettings);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });
  
  
  // Wine attributes generation
  app.post("/api/wines/attributes/generate", async (req: Request, res: Response) => {
    try {
      const result = generateWineAttributesSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos",
          errors: result.error.errors
        });
      }

      const attributes = await generateWineAttributes(result.data.produtos);
      res.json(attributes);
    } catch (error) {
      console.error("Error generating wine attributes:", error);
      res.status(500).json({ message: "Error generating wine attributes" });
    }
  });
  
// Check if API key is available for the current provider or a specified one
  app.get("/api/settings/check-api-key", (req: Request, res: Response) => {
    try {
      const provider = req.query.provider as string || config.getAIProvider();
      const hasKey = config.hasRequiredAPIKey(provider as any);
      res.json({ provider, hasKey });
    } catch (error) {
      console.error("Error checking API key:", error);
      res.status(500).json({ message: "Error checking API key" });
    }
  });

  
  // Wine CSV processing routes
  app.post("/api/wines/attributes/process-csv", async (req: Request, res: Response) => {
    try {
      if (!req.files || !('file' in req.files)) {
        return res.status(400).json({ message: 'No CSV file uploaded' });
      }

      const csvFile = req.files.file;
      if (Array.isArray(csvFile)) {
        return res.status(400).json({ message: 'Multiple files not supported' });
      }

      if (csvFile.mimetype !== 'text/csv') {
        return res.status(400).json({ message: 'File must be a CSV' });
      }

      const result = await processWineCSV(csvFile.data);
      // Get the directory name and file name for the download URL
      const dirName = path.basename(path.dirname(result.outputPath));
      const fileName = path.basename(result.outputPath);
      const downloadFilename = `${dirName}/${fileName}`;
      
      res.json({
        totalProcessed: result.attributes.length,
        attributes: result.attributes,
        downloadUrl: `/api/wines/files/${downloadFilename}`
      });
    } catch (error) {
      console.error('Error processing wine CSV:', error);
      res.status(500).json({ 
        message: 'Error processing wine CSV',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Download processed CSV file
  app.get("/api/wines/files/:directory/:filename", (req: Request, res: Response) => {
    try {
      const { directory, filename } = req.params;
      
      // Validate directory format
      if (!directory.startsWith('wine-processing-')) {
        return res.status(400).json({ message: 'Invalid directory format' });
      }

      // Construct the full file path
      const tempDir = path.join(os.tmpdir(), directory);
      const filePath = path.join(tempDir, filename);
      
      // Security check: ensure the file is within a wine-processing temp directory
      if (!filePath.startsWith(os.tmpdir()) || !filePath.includes('wine-processing-')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found or expired' });
      }

      // Get file name from path
      const downloadName = path.basename(filePath);

      // Send file
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${downloadName}`);
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({ 
        message: 'Error downloading file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/wines/attributes/export-csv", async (req: Request, res: Response) => {
    try {
      const { attributes, includeConfidence = true } = req.body;

      if (!Array.isArray(attributes)) {
        return res.status(400).json({ message: 'Attributes must be an array' });
      }

      const csvBuffer = generateWineAttributesCSV(attributes);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=wine-attributes.csv');
      res.send(csvBuffer);
    } catch (error) {
      console.error('Error exporting wine attributes to CSV:', error);
      res.status(500).json({ 
        message: 'Error exporting wine attributes to CSV',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Wine enrichment data endpoints
  app.get("/api/wines/enrichment/executions", async (req: Request, res: Response) => {
    try {
      const executions = await db.select().from(wine_enrichment_execution).orderBy(wine_enrichment_execution.execution_date);
      res.json(executions);
    } catch (error) {
      console.error('Error fetching wine enrichment executions:', error);
      res.status(500).json({ 
        message: 'Error fetching wine enrichment executions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/wines/enrichment/executions/:id", async (req: Request, res: Response) => {
    try {
      const executionId = parseInt(req.params.id);
      if (isNaN(executionId)) {
        return res.status(400).json({ message: 'Invalid execution ID' });
      }

      const execution = await db.select()
        .from(wine_enrichment_execution)
        .where(eq(wine_enrichment_execution.id, executionId))
        .limit(1);

      if (execution.length === 0) {
        return res.status(404).json({ message: 'Execution not found' });
      }

      const enrichmentRecords = await db.select()
        .from(wine_enrichment)
        .where(eq(wine_enrichment.id_execution, executionId))
        .orderBy(wine_enrichment.id);

      res.json({
        execution: execution[0],
        records: enrichmentRecords
      });
    } catch (error) {
      console.error('Error fetching wine enrichment execution:', error);
      res.status(500).json({ 
        message: 'Error fetching wine enrichment execution',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/wines/enrichment", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const enrichmentRecords = await db.select()
        .from(wine_enrichment)
        .orderBy(wine_enrichment.id)
        .limit(limit)
        .offset(offset);

      const totalCount = await db.select({ count: sql`count(*)` })
        .from(wine_enrichment);

      res.json({
        records: enrichmentRecords,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          totalPages: Math.ceil(Number(totalCount[0].count) / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching wine enrichment records:', error);
      res.status(500).json({ 
        message: 'Error fetching wine enrichment records',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Wine enrichment comparison endpoint
  app.get("/api/wines/enrichment/comparison", async (req: Request, res: Response) => {
    try {
      // Get enrichment records with their corresponding product data
      const comparisonData = await db.select({
        // Enrichment data
        enrichment_id: wine_enrichment.id,
        product_id: wine_enrichment.product_id,
        product_title: wine_enrichment.product_title,
        ai_country: wine_enrichment.country,
        ai_country_confidence: wine_enrichment.country_confidence,
        ai_type: wine_enrichment.type,
        ai_type_confidence: wine_enrichment.type_confidence,
        ai_classification: wine_enrichment.classification,
        ai_classification_confidence: wine_enrichment.classification_confidence,
        ai_grape_variety: wine_enrichment.grape_variety,
        ai_grape_variety_confidence: wine_enrichment.grape_variety_confidence,
        ai_size: wine_enrichment.size,
        ai_size_confidence: wine_enrichment.size_confidence,
        ai_closure: wine_enrichment.closure,
        ai_closure_confidence: wine_enrichment.closure_confidence,
        ai_pairings: wine_enrichment.pairings,
        ai_pairings_confidence: wine_enrichment.pairings_confidence,
        ai_status: wine_enrichment.status,
        ai_provider: wine_enrichment.provider,
        // Original product data
        original_country: products.country,
        original_type: products.type,
        original_classification: products.classification,
        original_grape_variety: products.grape_variety,
        original_size: products.size,
        original_closure: products.closure,
        original_pairings: products.pairings,
      })
      .from(wine_enrichment)
      .leftJoin(products, eq(wine_enrichment.product_id, products.id))
      .where(eq(wine_enrichment.status, 'OK'))
      .limit(1000); // Limit to avoid performance issues

      // Calculate comparison statistics
      const stats = {
        total_comparisons: comparisonData.length,
        country: {
          total_with_original: 0,
          matches: 0,
          ai_filled: 0,
          original_filled: 0
        },
        type: {
          total_with_original: 0,
          matches: 0,
          ai_filled: 0,
          original_filled: 0
        },
        classification: {
          total_with_original: 0,
          matches: 0,
          ai_filled: 0,
          original_filled: 0
        },
        grape_variety: {
          total_with_original: 0,
          matches: 0,
          ai_filled: 0,
          original_filled: 0
        },
        size: {
          total_with_original: 0,
          matches: 0,
          ai_filled: 0,
          original_filled: 0
        },
        closure: {
          total_with_original: 0,
          matches: 0,
          ai_filled: 0,
          original_filled: 0
        },
        // pairings: {
        //   total_with_original: 0,
        //   matches: 0,
        //   ai_filled: 0,
        //   original_filled: 0
        // }
      };

      // Calculate statistics for each attribute
      comparisonData.forEach(row => {
        // Country
        if (row.ai_country) stats.country.ai_filled++;
        if (row.original_country) stats.country.original_filled++;
        if (row.ai_country && row.original_country) {
          stats.country.total_with_original++;
          if (row.ai_country.toLowerCase() === row.original_country.toLowerCase()) {
            stats.country.matches++;
          }
        }

        // Type
        if (row.ai_type) stats.type.ai_filled++;
        if (row.original_type) stats.type.original_filled++;
        if (row.ai_type && row.original_type) {
          stats.type.total_with_original++;
          if (row.ai_type.toLowerCase() === row.original_type.toLowerCase()) {
            stats.type.matches++;
          }
        }

        // Classification
        if (row.ai_classification) stats.classification.ai_filled++;
        if (row.original_classification) stats.classification.original_filled++;
        if (row.ai_classification && row.original_classification) {
          stats.classification.total_with_original++;
          if (row.ai_classification.toLowerCase() === row.original_classification.toLowerCase()) {
            stats.classification.matches++;
          }
        }

        // Grape variety
        if (row.ai_grape_variety) stats.grape_variety.ai_filled++;
        if (row.original_grape_variety) stats.grape_variety.original_filled++;
        if (row.ai_grape_variety && row.original_grape_variety) {
          stats.grape_variety.total_with_original++;
          if (row.ai_grape_variety.toLowerCase() === row.original_grape_variety.toLowerCase()) {
            stats.grape_variety.matches++;
          }
        }

        // Size
        if (row.ai_size) stats.size.ai_filled++;
        if (row.original_size) stats.size.original_filled++;
        if (row.ai_size && row.original_size) {
          stats.size.total_with_original++;
          if (row.ai_size.toLowerCase() === row.original_size.toLowerCase()) {
            stats.size.matches++;
          }
        }

        // Closure
        if (row.ai_closure) stats.closure.ai_filled++;
        if (row.original_closure) stats.closure.original_filled++;
        if (row.ai_closure && row.original_closure) {
          stats.closure.total_with_original++;
          if (row.ai_closure.toLowerCase() === row.original_closure.toLowerCase()) {
            stats.closure.matches++;
          }
        }

        // Pairings (special handling for multiple values)
        // if (row.ai_pairings) stats.pairings.ai_filled++;
        // if (row.original_pairings) stats.pairings.original_filled++;
        // if (row.ai_pairings && row.original_pairings) {
        //   stats.pairings.total_with_original++;
        //   // Simple comparison for pairings (could be improved)
        //   if (row.ai_pairings.toLowerCase().includes(row.original_pairings.toLowerCase()) ||
        //       row.original_pairings.toLowerCase().includes(row.ai_pairings.toLowerCase())) {
        //     stats.pairings.matches++;
        //   }
        // }
      });

      res.json({
        statistics: stats,
        sample_data: comparisonData.slice(0, 50) // Return sample for detailed view
      });
    } catch (error) {
      console.error('Error fetching wine enrichment comparison:', error);
      res.status(500).json({ 
        message: 'Error fetching wine enrichment comparison',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Wine enrichment accuracy analysis endpoints
  app.get("/api/wines/enrichment/executions/:id/accuracy", async (req: Request, res: Response) => {
    try {
      const executionId = parseInt(req.params.id);
      if (isNaN(executionId)) {
        return res.status(400).json({ message: 'Invalid execution ID' });
      }

      const accuracyReport = await analyzeExecutionAccuracy(executionId);
      res.json(accuracyReport);
    } catch (error) {
      console.error('Error analyzing execution accuracy:', error);
      res.status(500).json({ 
        message: 'Error analyzing execution accuracy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/wines/enrichment/executions/:id/accuracy/summary", async (req: Request, res: Response) => {
    try {
      const executionId = parseInt(req.params.id);
      if (isNaN(executionId)) {
        return res.status(400).json({ message: 'Invalid execution ID' });
      }

      const reportSummary = await generateAccuracyReportSummary(executionId);
      res.json({ summary: reportSummary });
    } catch (error) {
      console.error('Error generating accuracy report summary:', error);
      res.status(500).json({ 
        message: 'Error generating accuracy report summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
