import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type AIProvider = "openai" | "anthropic" | "gemini";

export const aiProviders = ["openai", "anthropic", "gemini"];

export const AppSettingsSchema = z.object({
  aiProvider: z.enum(["openai", "anthropic", "gemini"]).default("openai"),
  language: z.enum(["pt", "en"]).default("pt"),
  confidence: z.number().min(0).max(100).default(50)
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

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
