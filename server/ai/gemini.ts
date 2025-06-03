import { GoogleGenerativeAI } from '@google/generative-ai';
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
import { marcas, tamanhos, embalagens, classificacoes, teoresAlcoolicos, origens, retornaveis, tipos } from '@shared/schema';
import { log } from '../vite';
import openai from 'openai';

// O modelo mais recente é o gemini-pro
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function createDefaultWineAttributes(produto: WineInput): WineAttributes {
  return {
    id: produto.id.toString(),
    nome: produto.nome,
    status: 'Error',
    pais: { value: '', confidence: 0 },
    tipo: { value: '', confidence: 0 },
    classificacao: { value: '', confidence: 0 },
    uva: { value: '', confidence: 0 },
    tamanho: { value: '', confidence: 0 },
    tampa: { value: '', confidence: 0 },
    harmonizacao: { values: [], confidence: 0 }
  };
}

async function parseGeminiResponse(content: string | null, isArray: boolean = false): Promise<any> {
  if (!content) {
    throw new Error('No content in response');
  }

  try {
    const jsonMatch = content.match(isArray ? /\[\s*\{[\s\S]*\}\s*\]/ : /\{[\s\S]*\}/);
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
    throw error;
  }
}

export async function generateWineAttribute(produto: WineInput): Promise<WineAttributes> {


  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    /* const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); */
    const prompt = generateWineAttributesPromptSingle(produto);
    const result = await model.generateContent(prompt);
    log('Gemini result:', JSON.stringify(result, null, 2));
    const content = result.response.text();
    
    const parsedResult = await parseGeminiResponse(content, false);
    
    return {
      id: parsedResult.id.toString(),
      nome: parsedResult.nome,
      status: 'OK',
      pais: {
        value: validateEnum(parsedResult.pais.value, Countries),
        confidence: validateConfidence(parsedResult.pais.confidence)
      },
      tipo: {
        value: validateEnum(parsedResult.tipo.value, WineTypes),
        confidence: validateConfidence(parsedResult.tipo.confidence)
      },
      classificacao: {
        value: validateEnum(parsedResult.classificacao.value, Classifications),
        confidence: validateConfidence(parsedResult.classificacao.confidence)
      },
      uva: {
        value: validateEnum(parsedResult.uva.value, GrapeVarieties),
        confidence: validateConfidence(parsedResult.uva.confidence)
      },
      tamanho: {
        value: validateEnum(parsedResult.tamanho.value, Sizes),
        confidence: validateConfidence(parsedResult.tamanho.confidence)
      },
      tampa: {
        value: validateEnum(parsedResult.tampa.value, Closures),
        confidence: validateConfidence(parsedResult.tampa.confidence)
      },
      harmonizacao: {
        values: validateMultipleEnum(parsedResult.harmonizacao.values, WinePairings),
        confidence: validateConfidence(parsedResult.harmonizacao.confidence)
      }
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
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    
    const parsedResults = await parseGeminiResponse(content, true);
    
    return parsedResults.map((result: any) => ({
      id: result.id.toString(),
      nome: result.nome,
      status: 'OK',
      pais: {
        value: validateEnum(result.pais.value, Countries),
        confidence: validateConfidence(result.pais.confidence)
      },
      tipo: {
        value: validateEnum(result.tipo.value, WineTypes),
        confidence: validateConfidence(result.tipo.confidence)
      },
      classificacao: {
        value: validateEnum(result.classificacao.value, Classifications),
        confidence: validateConfidence(result.classificacao.confidence)
      },
      uva: {
        value: validateEnum(result.uva.value, GrapeVarieties),
        confidence: validateConfidence(result.uva.confidence)
      },
      tamanho: {
        value: validateEnum(result.tamanho.value, Sizes),
        confidence: validateConfidence(result.tamanho.confidence)
      },
      tampa: {
        value: validateEnum(result.tampa.value, Closures),
        confidence: validateConfidence(result.tampa.confidence)
      },
      harmonizacao: {
        values: validateMultipleEnum(result.harmonizacao.values, WinePairings),
        confidence: validateConfidence(result.harmonizacao.confidence)
      }
    }));
  } catch (error) {
    console.error('Error generating wine attributes:', error);
    return produtos.map(createDefaultWineAttributes);
  }
}
