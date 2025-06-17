import { GoogleGenerativeAI } from '@google/generative-ai';
import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import Bottleneck from 'bottleneck';

import {
  Countries,
  WineTypes,
  Classifications,
  GrapeVarieties,
  Sizes,
  Closures,
  WinePairings,
  type WineAttributes,
  type WineInput
} from '../domain/wine';
import { validateEnum, validateMultipleEnum, validateConfidence } from '../domain/helpers';
import { generateWineAttributesPrompt, generateWineAttributesPromptSingle } from '../domain/prompts';
import { log } from '../vite';

// O modelo mais recente é o gemini-pro
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY});

// Create a rate limiter: 30 requests per minute
const limiter = new Bottleneck({
  reservoir: 30, // initial number of requests
  reservoirRefreshAmount: 30,
  reservoirRefreshInterval: 60 * 1000, // refresh every minute
  maxConcurrent: 1, // optional: 1 at a time to avoid burst
});

function cleanId(id: any): string {
  if (!id) return '';
  let cleanId = String(id);
  // Remove brackets, quotes, and other unwanted characters
  cleanId = cleanId.replace(/[\[\]"']/g, '').trim();
  return cleanId;
}

async function parseGeminiResponse(content: string | null, isArray: boolean = false): Promise<any> {
  if (!content) {
    throw new Error('No content in response');
  }

  try {
    // Clean up the content first - remove markdown code blocks if present
    let cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    
    const jsonMatch = cleanContent.match(isArray ? /\[\s*\{[\s\S]*\}\s*\]/ : /\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No JSON ${isArray ? 'array' : 'object'} found in response`);
    }

    let jsonString = jsonMatch[0];

    // Remove extra backslashes if present (double-escaped JSON)
    if (jsonString.includes('\\"')) {
      jsonString = jsonString.replace(/\\/g, '');
    }

    // If still a stringified JSON, parse again
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
    } catch (e) {
      throw new Error('Failed to parse JSON after cleaning: ' + (e instanceof Error ? e.message : String(e)));
    }

    if (isArray && !Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    return parsed;
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.error('Raw content:', content);
    throw error;
  }
}

export async function generateWineAttribute(produto: WineInput): Promise<WineAttributes> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }
    const prompt = generateWineAttributesPromptSingle(produto);
    
    log('Gemini prompt:', prompt);
    // Use limiter to schedule the Gemini API call
    const result = await limiter.schedule(() => ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        prompt,
      ],
      config: {
        tools: [{googleSearch: {}}], 
        toolConfig: {
          functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO
          }
        }
      }, 
    }));

    log('Gemini result:', JSON.stringify(result, null, 2));
    
    const parsedResult = await parseGeminiResponse(result.text || null, false);
    log('Gemini parsed result:', parsedResult);
    return {
      id: cleanId(parsedResult.id),
      title: parsedResult.nome,
      status: 'OK',
      country: {
        value: validateEnum(parsedResult.pais.value, Countries),
        confidence: validateConfidence(parsedResult.pais.confidence)
      },
      type: {
        value: validateEnum(parsedResult.tipo.value, WineTypes),
        confidence: validateConfidence(parsedResult.tipo.confidence)
      },
      classification: {
        value: validateEnum(parsedResult.classificacao.value, Classifications),
        confidence: validateConfidence(parsedResult.classificacao.confidence)
      },
      grape_variety: {
        value: validateEnum(parsedResult.uva.value, GrapeVarieties),
        confidence: validateConfidence(parsedResult.uva.confidence)
      },
      size: {
        value: validateEnum(parsedResult.tamanho.value, Sizes),
        confidence: validateConfidence(parsedResult.tamanho.confidence)
      },
      closure: {
        value: validateEnum(parsedResult.tampa.value, Closures),
        confidence: validateConfidence(parsedResult.tampa.confidence)
      },
      pairings: {
        values: validateMultipleEnum(parsedResult.harmonizacao.values, WinePairings),
        confidence: validateConfidence(parsedResult.harmonizacao.confidence)
      },
      confidence: null
    };
  } catch (error) {
    console.error('Error in Gemini generateWineAttribute:', error);
    console.error('Product input:', produto);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    throw error; // Re-throw to let wine-service handle it
  }
}

export async function generateWineAttributes(produtos: WineInput[]): Promise<WineAttributes[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = generateWineAttributesPrompt(produtos);
    log('Gemini prompt:', prompt);
    // Use limiter to schedule the Gemini API call
    const result = await limiter.schedule(() => model.generateContent(prompt));
    const content = result.response.text();
    
    const parsedResults = await parseGeminiResponse(content, true);
    log('Gemini parsed results:', parsedResults);
    return parsedResults.map((result: any) => ({
      id: cleanId(result.id),
      title: result.nome,
      status: 'OK',
      country: {
        value: validateEnum(result.pais.value, Countries),
        confidence: validateConfidence(result.pais.confidence)
      },
      type: {
        value: validateEnum(result.tipo.value, WineTypes),
        confidence: validateConfidence(result.tipo.confidence)
      },
      classification: {
        value: validateEnum(result.classificacao.value, Classifications),
        confidence: validateConfidence(result.classificacao.confidence)
      },
      grape_variety: {
        value: validateEnum(result.uva.value, GrapeVarieties),
        confidence: validateConfidence(result.uva.confidence)
      },
      size: {
        value: validateEnum(result.tamanho.value, Sizes),
        confidence: validateConfidence(result.tamanho.confidence)
      },
      closure: {
        value: validateEnum(result.tampa.value, Closures),
        confidence: validateConfidence(result.tampa.confidence)
      },
      pairings: {
        values: validateMultipleEnum(result.harmonizacao.values, WinePairings),
        confidence: validateConfidence(result.harmonizacao.confidence)
      },
      confidence: null
    }));
  } catch (error) {
    console.error('Error in Gemini generateWineAttributes (batch):', error);
    console.error('Product inputs:', produtos);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    throw error; // Re-throw to let wine-service handle it
  }
}
