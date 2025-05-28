import { 
  BeerProduct, 
  InsertBeerProduct, 
  User, 
  InsertUser, 
  AIEnhancementType,
  beerProducts,
  users,
  tipos
} from "@shared/schema";
import * as aiService from "./ai-service";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Beer product operations
  getAllBeerProducts(): Promise<BeerProduct[]>;
  getBeerProduct(productId: string): Promise<BeerProduct | undefined>;
  createBeerProduct(product: InsertBeerProduct): Promise<BeerProduct>;
  updateBeerProduct(productId: string, product: Partial<InsertBeerProduct>): Promise<BeerProduct | undefined>;
  deleteBeerProduct(productId: string): Promise<boolean>;
  createBulkBeerProducts(products: InsertBeerProduct[]): Promise<BeerProduct[]>;
  enhanceBeerProduct(productId: string, enhancementType: AIEnhancementType): Promise<BeerProduct | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private beerProducts: Map<string, BeerProduct>;
  private currentUserId: number;
  private currentProductId: number;

  constructor() {
    this.users = new Map();
    this.beerProducts = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Beer product operations
  async getAllBeerProducts(): Promise<BeerProduct[]> {
    return Array.from(this.beerProducts.values());
  }

  async getBeerProduct(productId: string): Promise<BeerProduct | undefined> {
    return this.beerProducts.get(productId);
  }

  async createBeerProduct(product: InsertBeerProduct): Promise<BeerProduct> {
    const id = this.currentProductId++;
    const newProduct = { 
      ...product, 
      id, 
      ai_enhanced: product.ai_enhanced === undefined ? null : !!product.ai_enhanced,
      descricao_sku: product.descricao_sku || null,
      tags: product.tags || null
    } as BeerProduct;
    this.beerProducts.set(product.product_id, newProduct);
    return newProduct;
  }

  async updateBeerProduct(productId: string, updates: Partial<InsertBeerProduct>): Promise<BeerProduct | undefined> {
    const existingProduct = this.beerProducts.get(productId);
    
    if (!existingProduct) {
      return undefined;
    }
    
    const updatedProduct = {
      ...existingProduct,
      ...updates,
      ai_enhanced: updates.ai_enhanced !== undefined ? updates.ai_enhanced : existingProduct.ai_enhanced,
      descricao_sku: updates.descricao_sku || existingProduct.descricao_sku,
      tags: updates.tags || existingProduct.tags
    } as BeerProduct;
    
    this.beerProducts.set(productId, updatedProduct);
    return updatedProduct;
  }

  async deleteBeerProduct(productId: string): Promise<boolean> {
    return this.beerProducts.delete(productId);
  }

  async createBulkBeerProducts(products: InsertBeerProduct[]): Promise<BeerProduct[]> {
    const createdProducts: BeerProduct[] = [];
    
    for (const product of products) {
      // Skip if product already exists
      if (this.beerProducts.has(product.product_id)) {
        continue;
      }
      
      const id = this.currentProductId++;
      const newProduct = { 
        ...product, 
        id, 
        ai_enhanced: product.ai_enhanced === undefined ? null : !!product.ai_enhanced,
        descricao_sku: product.descricao_sku || null,
        tags: product.tags || null
      } as BeerProduct;
      this.beerProducts.set(product.product_id, newProduct);
      createdProducts.push(newProduct);
    }
    
    return createdProducts;
  }

  async enhanceBeerProduct(productId: string, enhancementType: AIEnhancementType): Promise<BeerProduct | undefined> {
    const existingProduct = this.beerProducts.get(productId);
    
    if (!existingProduct) {
      return undefined;
    }
    
    const beerInfo = {
      product_id: existingProduct.product_id,
      nome_sku: existingProduct.nome_sku,
      marca: existingProduct.marca,
      tamanho: existingProduct.tamanho,
      embalagem: existingProduct.embalagem,
      classificacao: existingProduct.classificacao,
      teor_alcoolico: existingProduct.teor_alcoolico,
      origem: existingProduct.origem,
      retornavel: existingProduct.retornavel,
      tipo: existingProduct.tipo || tipos[0]
    };
    
    try {
      const enhancedData = await aiService.enhanceBeerProduct(beerInfo, enhancementType);
      
      const updates: Partial<InsertBeerProduct> = {
        ai_enhanced: true
      };
      
      if (enhancedData.description) {
        updates.descricao_sku = enhancedData.description;
      }
      
      if (enhancedData.tags) {
        updates.tags = enhancedData.tags;
      }
      
      return this.updateBeerProduct(productId, updates);
    } catch (error) {
      console.error("Error enhancing product:", error);
      throw new Error(`Failed to enhance product ${productId}`);
    }
  }
}

export class PostgreSQLStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Beer product operations
  async getAllBeerProducts(): Promise<BeerProduct[]> {
    return db.select().from(beerProducts).orderBy(asc(beerProducts.id));
  }

  async getBeerProduct(productId: string): Promise<BeerProduct | undefined> {
    const [product] = await db.select().from(beerProducts).where(eq(beerProducts.product_id, productId));
    return product || undefined;
  }

  async createBeerProduct(product: InsertBeerProduct): Promise<BeerProduct> {
    // Process the product data to ensure optional fields are handled correctly
    const processedProduct = {
      ...product,
      ai_enhanced: product.ai_enhanced === undefined ? false : !!product.ai_enhanced,
      descricao_sku: product.descricao_sku || null,
      tags: product.tags || null
    };
    
    const [newProduct] = await db.insert(beerProducts).values(processedProduct).returning();
    return newProduct;
  }

  async updateBeerProduct(productId: string, updates: Partial<InsertBeerProduct>): Promise<BeerProduct | undefined> {
    // Check if product exists
    const existingProduct = await this.getBeerProduct(productId);
    if (!existingProduct) {
      return undefined;
    }
    
    // Process updates to handle null/undefined values correctly
    const processedUpdates = {
      ...updates,
      ai_enhanced: updates.ai_enhanced !== undefined 
        ? !!updates.ai_enhanced 
        : existingProduct.ai_enhanced
    };
    
    // Update the product in the database
    const [updatedProduct] = await db
      .update(beerProducts)
      .set(processedUpdates)
      .where(eq(beerProducts.product_id, productId))
      .returning();
    
    return updatedProduct;
  }

  async deleteBeerProduct(productId: string): Promise<boolean> {
    const result = await db
      .delete(beerProducts)
      .where(eq(beerProducts.product_id, productId));
    
    return true; // In PostgreSQL, we don't get a direct count of deleted rows without explicit returning
  }

  async createBulkBeerProducts(products: InsertBeerProduct[]): Promise<BeerProduct[]> {
    if (products.length === 0) {
      return [];
    }

    console.log('Starting bulk product creation:', JSON.stringify(products, null, 2));
    
    try {
      // Process each product to ensure optional fields are handled correctly
      const processedProducts = products.map(product => ({
        ...product,
        ai_enhanced: product.ai_enhanced === undefined ? false : !!product.ai_enhanced,
        descricao_sku: product.descricao_sku || null,
        tags: product.tags || null
      }));

      console.log('Processed products:', JSON.stringify(processedProducts, null, 2));
      
      const createdProducts = await db.insert(beerProducts).values(processedProducts).returning();
      console.log('Products created successfully:', JSON.stringify(createdProducts, null, 2));
      
      return createdProducts;
    } catch (error) {
      console.error('Error creating products:', error);
      throw error;
    }
  }

  async enhanceBeerProduct(productId: string, enhancementType: AIEnhancementType): Promise<BeerProduct | undefined> {
    // Get the existing product
    const existingProduct = await this.getBeerProduct(productId);
    if (!existingProduct) {
      return undefined;
    }
    
    // Prepare the beer info for the AI service
    const beerInfo = {
      product_id: existingProduct.product_id,
      nome_sku: existingProduct.nome_sku,
      marca: existingProduct.marca,
      tamanho: existingProduct.tamanho,
      embalagem: existingProduct.embalagem,
      classificacao: existingProduct.classificacao,
      teor_alcoolico: existingProduct.teor_alcoolico,
      origem: existingProduct.origem,
      retornavel: existingProduct.retornavel,
      tipo: existingProduct.tipo || tipos[0]
    };
    
    try {
      // Call the AI service to enhance the product
      const enhancedData = await aiService.enhanceBeerProduct(beerInfo, enhancementType);
      
      // Prepare updates based on enhancement type
      const updates: Partial<InsertBeerProduct> = {
        ai_enhanced: true
      };
      
      if (enhancedData.description) {
        updates.descricao_sku = enhancedData.description;
      }
      
      if (enhancedData.tags) {
        updates.tags = enhancedData.tags;
      }
      
      // Atualiza os campos de categoria se a IA gerou valores para eles
      if (enhancedData.fields) {
        if (enhancedData.fields.marca) updates.marca = enhancedData.fields.marca;
        if (enhancedData.fields.tamanho) updates.tamanho = enhancedData.fields.tamanho;
        if (enhancedData.fields.embalagem) updates.embalagem = enhancedData.fields.embalagem;
        if (enhancedData.fields.classificacao) updates.classificacao = enhancedData.fields.classificacao;
        if (enhancedData.fields.teor_alcoolico) updates.teor_alcoolico = enhancedData.fields.teor_alcoolico;
        if (enhancedData.fields.origem) updates.origem = enhancedData.fields.origem;
        if (enhancedData.fields.retornavel) updates.retornavel = enhancedData.fields.retornavel;
        if (enhancedData.fields.tipo) updates.tipo = enhancedData.fields.tipo;
      }
      
      // Update the product with enhanced data
      return this.updateBeerProduct(productId, updates);
    } catch (error) {
      console.error("Error enhancing product:", error);
      throw new Error(`Failed to enhance product ${productId}`);
    }
  }
}

// Change from MemStorage to PostgreSQLStorage
export const storage = new PostgreSQLStorage();
