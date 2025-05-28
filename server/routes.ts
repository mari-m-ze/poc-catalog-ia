import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  AIEnhancementSchema, 
  InsertBeerProduct, 
  insertBeerProductSchema,
  AppSettingsSchema,
  aiProviders,
  CSVBeerProduct
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { embalagens, marcas, classificacoes, tamanhos, teoresAlcoolicos, origens, retornaveis, tipos } from "@shared/schema";
import { config } from "./config";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { generateWineAttributes, processWineCSV, generateWineAttributesCSV } from "./api/wine-service";
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { generateWineAttributesSchema } from "../shared/wine-schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories stats endpoint
  app.get("/api/categories/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await db.execute(sql`
        SELECT 
          COALESCE(categoria, 'Uncategorized') as name,
          COUNT(*) as "totalProducts",
          COUNT(CASE WHEN ai_enhanced = true THEN 1 END) as "enhancedProducts",
          COUNT(CASE WHEN ai_enhanced = false OR ai_enhanced IS NULL THEN 1 END) as "needsEnhancement"
        FROM beer_products
        GROUP BY categoria
        ORDER BY "totalProducts" DESC
      `);
      
      res.json(stats.rows);
    } catch (error) {
      console.error('Error fetching category statistics:', error);
      res.status(500).json({ error: 'Failed to fetch category statistics' });
    }
  });

  // Beer products API routes
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllBeerProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:productId", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const product = await storage.getBeerProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const productData = insertBeerProductSchema.parse(req.body);
      const newProduct = await storage.createBeerProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.patch("/api/products/:productId", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const updates = req.body;
      
      const updatedProduct = await storage.updateBeerProduct(productId, updates);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Error updating product" });
    }
  });

  app.delete("/api/products/:productId", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const deleted = await storage.deleteBeerProduct(productId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Bulk delete products
  app.post("/api/products/bulk-delete", async (req: Request, res: Response) => {
    try {
      const { productIds } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "Invalid request. Expected array of product IDs." });
      }

      const results = await Promise.all(
        productIds.map(id => storage.deleteBeerProduct(id))
      );

      const deletedCount = results.filter(Boolean).length;
      
      res.json({ 
        message: `Successfully deleted ${deletedCount} products`,
        deletedCount
      });
    } catch (error) {
      console.error("Error bulk deleting products:", error);
      res.status(500).json({ message: "Error bulk deleting products" });
    }
  });

  // Bulk import products
  app.post("/api/products/import", async (req: Request, res: Response) => {
    try {
      const csvProducts: CSVBeerProduct[] = req.body;
      
      console.log('Received CSV products:', JSON.stringify(csvProducts, null, 2));
      
      if (!Array.isArray(csvProducts) || csvProducts.length === 0) {
        return res.status(400).json({ message: "Invalid product data. Expected array of products." });
      }
      
      // Validate and transform each product
      const validatedProducts: InsertBeerProduct[] = [];
      const errors: { index: number; error: string }[] = [];
      
      for (let i = 0; i < csvProducts.length; i++) {
        try {
          console.log(`Processing product ${i}:`, JSON.stringify(csvProducts[i], null, 2));
          
          // Extrair campos essenciais
          const { product_id, nome_sku } = csvProducts[i];
          
          // Validar campos essenciais
          if (!product_id || !nome_sku) {
            throw new Error("Campos obrigatórios ausentes: product_id, nome_sku");
          }
          
          // Criar produto básico com valores padrão para os outros campos
          const produto: InsertBeerProduct = {
            product_id,
            product_variant: csvProducts[i].product_variant || product_id, // Usar product_id como fallback
            nome_sku,
            volume_hectolitros: csvProducts[i].volume_hectolitro 
              ? String(csvProducts[i].volume_hectolitro).replace(/['"]/g, '').replace(',', '.') // Remove aspas e converte vírgula
              : "0,0".replace(',', '.'),
            marca: csvProducts[i].marca || marcas[0],
            tamanho: csvProducts[i].Tamanho || tamanhos[0],
            embalagem: csvProducts[i].Embalagem || embalagens[0],
            retornavel: csvProducts[i].Retornável?.trim() || retornaveis[0],
            origem: csvProducts[i].Origem?.trim() || origens[0],
            teor_alcoolico: csvProducts[i]["Teor alcoólico"] || teoresAlcoolicos[0],
            tipo: csvProducts[i]["Tipo de Cerveja"] || tipos[0],
            classificacao: csvProducts[i]["Classificação da Cerveja"] || classificacoes[0],
            descricao_sku: csvProducts[i].descricao_sku || null,
            tags: csvProducts[i].tags || null,
            ai_enhanced: false
          };

          console.log('Transformed product:', JSON.stringify(produto, null, 2));
          
          // Validar com Zod para garantir integridade
          const validatedProduct = insertBeerProductSchema.parse(produto);
          validatedProducts.push(validatedProduct);
          
          console.log('Product validated successfully');
        } catch (error) {
          console.error('Error processing product:', error);
          if (error instanceof ZodError) {
            const validationError = fromZodError(error);
            errors.push({ index: i, error: validationError.message });
          } else if (error instanceof Error) {
            errors.push({ index: i, error: error.message });
          } else {
            errors.push({ index: i, error: "Unknown validation error" });
          }
        }
      }
      
      if (errors.length > 0) {
        console.error('Validation errors:', errors);
        return res.status(400).json({ 
          message: "Validation errors in product data", 
          errors 
        });
      }
      
      console.log('Creating products in database:', JSON.stringify(validatedProducts, null, 2));
      const createdProducts = await storage.createBulkBeerProducts(validatedProducts);
      console.log('Products created successfully:', JSON.stringify(createdProducts, null, 2));
      
      res.status(201).json(createdProducts);
    } catch (error) {
      console.error("Error importing products:", error);
      res.status(500).json({ message: "Error importing products" });
    }
  });

  // AI Enhancement
  app.post("/api/products/:productId/enhance", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { enhancementType } = AIEnhancementSchema.parse({ ...req.body, productId });
      
      const enhancedProduct = await storage.enhanceBeerProduct(productId, enhancementType);
      
      if (!enhancedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(enhancedProduct);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error enhancing product:", error);
      res.status(500).json({ message: "Error enhancing product" });
    }
  });

  // Export selected columns
  app.post("/api/products/export", async (req: Request, res: Response) => {
    try {
      const { columns } = req.body;
      
      if (!Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ message: "Invalid export configuration. Expected array of column names." });
      }
      
      const products = await storage.getAllBeerProducts();
      
      const exportedProducts = products.map(product => {
        const exportedProduct: Record<string, any> = {};
        
        for (const column of columns) {
          if (column in product) {
            exportedProduct[column] = product[column as keyof typeof product];
          }
        }
        
        return exportedProduct;
      });
      
      res.json(exportedProducts);
    } catch (error) {
      console.error("Error exporting products:", error);
      res.status(500).json({ message: "Error exporting products" });
    }
  });

  // Reference data endpoints
  app.get("/api/reference/marcas", (_req: Request, res: Response) => {
    res.json(marcas);
  });

  app.get("/api/reference/tamanhos", (_req: Request, res: Response) => {
    res.json(tamanhos);
  });

  app.get("/api/reference/embalagens", (_req: Request, res: Response) => {
    res.json(embalagens);
  });

  app.get("/api/reference/retornaveis", (_req: Request, res: Response) => {
    res.json(retornaveis);
  });

  app.get("/api/reference/origens", (_req: Request, res: Response) => {
    res.json(origens);
  });

  app.get("/api/reference/teores-alcoolicos", (_req: Request, res: Response) => {
    res.json(teoresAlcoolicos);
  });

  app.get("/api/reference/classificacoes", (_req: Request, res: Response) => {
    res.json(classificacoes);
  });

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
