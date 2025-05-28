import { AIEnhancementType, AIProvider } from "@shared/schema";
import { config } from "./config";
import * as openai from "./openai";
import * as anthropic from "./anthropic";
import * as gemini from "./gemini";

type BeerField = {
  product_id: string;
  nome_sku: string;
  marca: string;
  tamanho: string;
  embalagem: string;
  classificacao: string;
  teor_alcoolico: string;
  origem: string;
  retornavel: string;
  tipo: string;
};

/**
 * Gera uma descrição para o produto de cerveja usando o provedor de IA configurado
 */
export async function generateBeerDescription(beerInfo: BeerField): Promise<string> {
  const provider = config.getAIProvider();

  if (!config.hasRequiredAPIKey(provider)) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  switch (provider) {
    case "openai":
      return await openai.generateBeerDescription(beerInfo);
    case "anthropic":
      return await anthropic.generateBeerDescription(beerInfo);
    case "gemini":
      return await gemini.generateBeerDescription(beerInfo);
    default:
      // Fallback to Anthropic
      return await anthropic.generateBeerDescription(beerInfo);
  }
}

/**
 * Gera tags para o produto de cerveja usando o provedor de IA configurado
 */
export async function generateBeerTags(beerInfo: BeerField): Promise<string> {
  const provider = config.getAIProvider();

  if (!config.hasRequiredAPIKey(provider)) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  switch (provider) {
    case "openai":
      return await openai.generateBeerTags(beerInfo);
    case "anthropic":
      return await anthropic.generateBeerTags(beerInfo);
    case "gemini":
      return await gemini.generateBeerTags(beerInfo);
    default:
      // Fallback to Anthropic
      return await anthropic.generateBeerTags(beerInfo);
  }
}

/**
 * Gera campos categóricos para o produto de cerveja usando o provedor de IA configurado
 */
export async function generateBeerFields(beerInfo: BeerField): Promise<{
  marca?: string;
  tamanho?: string;
  embalagem?: string;
  classificacao?: string;
  teor_alcoolico?: string;
  origem?: string;
  retornavel?: string;
  tipo?: string;
}> {
  const provider = config.getAIProvider();

  if (!config.hasRequiredAPIKey(provider)) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  switch (provider) {
    case "anthropic":
      return await anthropic.generateBeerFields(beerInfo);
    case "openai":
      return await openai.generateBeerFields(beerInfo);
    case "gemini":
      return await gemini.generateBeerFields(beerInfo);
    default:
      // Fallback to Anthropic
      return await anthropic.generateBeerFields(beerInfo);
  }
}

/**
 * Aprimora um produto de cerveja com descrição, tags e/ou campos categóricos usando o provedor de IA configurado
 */
export async function enhanceBeerProduct(
  beerInfo: BeerField, 
  enhancementType: AIEnhancementType
): Promise<{ 
  description?: string, 
  tags?: string,
  fields?: {
    marca?: string;
    tamanho?: string;
    embalagem?: string;
    classificacao?: string;
    teor_alcoolico?: string;
    origem?: string;
    retornavel?: string;
    tipo?: string;
  },
  accuracy?: {
    description?: number;
    tags?: number;
    fields?: number;
  }
}> {
  const provider = config.getAIProvider();

  if (!config.hasRequiredAPIKey(provider)) {
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  const result: { 
    description?: string, 
    tags?: string,
    fields?: {
      marca?: string;
      tamanho?: string;
      embalagem?: string;
      classificacao?: string;
      teor_alcoolico?: string;
      origem?: string;
      retornavel?: string;
      tipo?: string;
    },
    accuracy?: {
      description?: number;
      tags?: number;
      fields?: number;
    }
  } = {
    accuracy: {}
  };

  const calculateAccuracy = (data: any, type: string): number => {
    switch(type) {
      case 'description':
        // Higher confidence for structured product info
        return data && data.includes(beerInfo.marca) ? 85 : 70;
      case 'tags':
        // Medium confidence for tag generation
        return data ? 75 : 0;
      case 'fields':
        // High confidence for categorical data
        return Object.keys(data || {}).length > 0 ? 90 : 0;
      default:
        return 0;
    }
  };

  try {
    if (enhancementType === "description" || enhancementType === "all" || enhancementType === "complete") {
      result.description = await generateBeerDescription(beerInfo);
      result.accuracy!.description = calculateAccuracy(result.description, 'description');
    }

    if (enhancementType === "tags" || enhancementType === "all" || enhancementType === "complete") {
      result.tags = await generateBeerTags(beerInfo);
      result.accuracy!.tags = calculateAccuracy(result.tags, 'tags');
    }

    if (enhancementType === "fields" || enhancementType === "complete") {
      const fields = await generateBeerFields(beerInfo);
      Object.assign(result, fields);
      result.accuracy!.fields = calculateAccuracy(fields, 'fields');
    }
    return result;
  } catch (error) {
    console.error("Error enhancing beer product:", error);
    throw error;
  }
}