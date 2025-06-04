import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const beerProducts = pgTable("beer_products", {
  id: serial("id").primaryKey(),
  product_id: text("product_id").notNull().unique(),
  product_variant: text("product_variant").notNull(),
  nome_sku: text("nome_sku").notNull(),
  volume_hectolitros: text("volume_hectolitros").notNull(),
  marca: text("marca").notNull(),
  descricao_sku: text("descricao_sku"),
  tamanho: text("tamanho").notNull(),
  embalagem: text("embalagem").notNull(),
  retornavel: text("retornavel").notNull(),
  origem: text("origem").notNull(),
  teor_alcoolico: text("teor_alcoolico").notNull(),
  tipo: text("tipo").default("Outros"),
  categoria: text("categoria"),
  tags: text("tags"),
  classificacao: text("classificacao").notNull(),
  ai_enhanced: boolean("ai_enhanced").default(false),
});

export const insertBeerProductSchema = createInsertSchema(beerProducts).omit({
  id: true,
});

export type InsertBeerProduct = z.infer<typeof insertBeerProductSchema>;
export type BeerProduct = typeof beerProducts.$inferSelect;

export type AIEnhancementType = "description" | "tags" | "all" | "fields" | "complete";
export type AIProvider = "openai" | "anthropic" | "gemini";

export const aiProviders = ["openai", "anthropic", "gemini"];

export const AppSettingsSchema = z.object({
  aiProvider: z.enum(["openai", "anthropic", "gemini"]).default("openai"),
  language: z.enum(["pt", "en"]).default("pt"),
  confidence: z.number().min(0).max(100).default(50)
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

export type CSVBeerProduct = {
  product_id: string;
  product_variant: string;
  nome_sku: string;
  volume_hectolitros?: string;
  volume_hectolitro?: string;
  marca: string;
  descricao_sku?: string;
  tamanho?: string;
  Tamanho?: string;
  embalagem?: string;
  Embalagem?: string;
  retornavel?: string;
  "Retornável"?: string;
  origem?: string;
  "Origem"?: string;
  teor_alcoolico?: string;
  "Teor alcoólico"?: string;
  tipo?: string;
  "Tipo de Cerveja"?: string;
  categoria?: string;
  classificacao?: string;
  "Classificação da Cerveja"?: string;
  tags?: string;
  ai_enhanced?: boolean;
};

export const AIEnhancementSchema = z.object({
  productId: z.string(),
  enhancementType: z.enum(["description", "tags", "all", "fields", "complete"]),
});

export type AIEnhancementRequest = z.infer<typeof AIEnhancementSchema>;

export type ExportColumnsRequest = {
  columns: string[];
};

export const marcas = [
  "Antarctiva", "Beck's", "Bohemia", "Budweiser", "Brahma", "Caracu", 
  "Colorado", "Corona", "Eisenbahn", "Goose Island", "Hocus Pocus", 
  "Hoegaarden", "Leffe", "Michelob Ultra", "Original", "Patagonia", 
  "Serra Malte", "Skol", "Spaten", "Stella Artois", "Wäls", "Outras"
];

export const tamanhos = [
  "210ml", "269ml", "300ml", "330ml", "350ml", "355ml", 
  "473ml", "600ml", "1L", "Outros"
];

export const embalagens = ["Vidro", "Lata", "Barril", "Plástico"];

export const retornaveis = ["Sim", "Não"];

export const origens = ["Nacional", "Importada"];

export const teoresAlcoolicos = [
  "até 5%", "5% a 10%", "mais 10%", "Sem alcoól"
];

export const classificacoes = [
  "Populares", "Artesanais", "Sem álcool", "Sem glútem", "Retornáveis", "Chopp"
];

export const tipos = [
  "Pilsen", "Lager", "Puro Malte", "ALE", "IPA", "WEISS",
  "Stout Lager", "APA", "Double Pilsen", "Outros"
];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
