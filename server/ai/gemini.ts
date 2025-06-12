import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from "@google/genai";

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

function createDefaultWineAttributes(produto: WineInput): WineAttributes {
  return {
    id: produto.id.toString(),
    title: produto.title,
    status: 'Error',
    country: { value: '', confidence: 0 },
    type: { value: '', confidence: 0 },
    classification: { value: '', confidence: 0 },
    grape_variety: { value: '', confidence: 0 },
    size: { value: '', confidence: 0 },
    closure: { value: '', confidence: 0 },
    pairings: { values: [], confidence: 0 },
    confidence: null
  };
}

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

    const parsed = JSON.parse(jsonMatch[0]);
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
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        prompt,
      ],
      /* config: {
        tools: [{googleSearch: {}}],
      }, */
    });

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
    console.error('Error generating wine attribute:', error);
    return createDefaultWineAttributes(produto);
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
    const result = await model.generateContent(prompt);
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
    console.error('Error generating wine attributes:', error);
    return produtos.map(createDefaultWineAttributes);
  }
}
