import { pgTable, text, serial, integer, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";


export const products = pgTable("product", {
  id: integer("id").primaryKey(),
  product_variant_id: integer("product_variant_id"),
  title: varchar("title"),
  country: varchar("country"),
  type: varchar("type"),
  classification: varchar("classification"),
  grape_variety: varchar("grape_variety"),
  size: varchar("size"),
  closure: varchar("closure"),
  pairings: varchar("pairings"),
});

export const wine_enrichment = pgTable("wine_enrichment", {
  id: serial("id").primaryKey(),
  id_execution: integer("id_execution").references(() => wine_enrichment_execution.id, { onDelete: "cascade" }),
  product_id: integer("product_id"),
  product_title: varchar("product_title"),
  country: varchar("country"),
  country_confidence: integer("country_confidence"),
  type: varchar("type"),
  type_confidence: integer("type_confidence"),
  classification: varchar("classification"),
  classification_confidence: integer("classification_confidence"),
  grape_variety: varchar("grape_variety"),
  grape_variety_confidence: integer("grape_variety_confidence"),
  size: varchar("size"),
  size_confidence: integer("size_confidence"),
  closure: varchar("closure"),
  closure_confidence: integer("closure_confidence"),
  pairings: varchar("pairings"),
  pairings_confidence: integer("pairings_confidence"),
  provider: varchar("provider"),
  status: varchar("status").notNull().default("Pending"),
  error: text("error"),
});

export const wine_enrichment_execution = pgTable("wine_enrichment_execution", {
  id: serial("id").primaryKey(),
  execution_date: timestamp("execution_date"),
  provider: varchar("provider"),
  status: varchar("status").notNull().default("Pending"),
});

// export const country = pgTable("country", {
//   id: serial("id").primaryKey(),
//   name: varchar("name"),
// });

// export const type = pgTable("type", {
//   id: serial("id").primaryKey(),
//   name: varchar("name"),
// });

// export const classification = pgTable("classification", {
//   id: serial("id").primaryKey(),
//   name: varchar("name"),
// });

// export const grape_variety = pgTable("grape_variety", {
//   id: serial("id").primaryKey(),
//   name: varchar("name"),
// });

// export const size = pgTable("size", {
//   id: serial("id").primaryKey(),
//   name: varchar("name"),
// });

// export const closure = pgTable("closure", {
//   id: serial("id").primaryKey(),
//   name: varchar("name"),
// });

// export const pairings = pgTable("pairings", {
//   id: serial("id").primaryKey(),
//   name: varchar("name"),
// });

// Create insert schemas
export const insertProductSchema = createInsertSchema(products);
export const insertWineEnrichmentSchema = createInsertSchema(wine_enrichment);
export const insertWineEnrichmentExecutionSchema = createInsertSchema(wine_enrichment_execution);
// export const insertCountrySchema = createInsertSchema(country);
// export const insertTypeSchema = createInsertSchema(type);
// export const insertClassificationSchema = createInsertSchema(classification);
// export const insertGrapeVarietySchema = createInsertSchema(grape_variety);
// export const insertSizeSchema = createInsertSchema(size);
// export const insertClosureSchema = createInsertSchema(closure);
// export const insertPairingsSchema = createInsertSchema(pairings);

// TypeScript types
export type Product = typeof products.$inferSelect;
export type WineEnrichment = typeof wine_enrichment.$inferSelect;
export type WineEnrichmentExecution = typeof wine_enrichment_execution.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type InsertWineEnrichment = typeof wine_enrichment.$inferInsert;
export type InsertWineEnrichmentExecution = typeof wine_enrichment_execution.$inferInsert;

// Enum types
/* export type WineEnrichmentStatus = "OK" | "ERROR" | "PENDING";
export type WineExecutionStatus = "OK" | "ERROR" | "PENDING"; */

