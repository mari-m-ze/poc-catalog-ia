import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AppSettingsSchema, aiProviders } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { config } from "./config";
import { generateWineAttributes, processWineCSV, generateWineAttributesCSV } from "./api/wine-service";
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { generateWineAttributesSchema } from "../shared/wine-schema";

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
  const httpServer = createServer(app);
  return httpServer;
}
