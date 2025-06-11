import Anthropic from '@anthropic-ai/sdk';
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
import { generateWineAttributesPrompt } from '../domain/prompts';
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
import { log } from '../vite';


export async function generateWineAttributes(produtos: WineInput[]): Promise<WineAttributes[]> {
  try {
    const prompt = generateWineAttributesPrompt(produtos);
    
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedResults = JSON.parse(jsonMatch[0]);
      log('Anthropic parsed results:', parsedResults);
      if (!Array.isArray(parsedResults)) {
        throw new Error('Response is not an array');
      }

      // Map each result to its attributes
      return parsedResults.map(result => ({
        id: result.id,
        title: result.nome,
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

    } catch (jsonError) {
      console.error('Error parsing Anthropic response:', jsonError);
      return produtos.map(() => ({
        id: '',
        title: '',
        pais: { value: '', confidence: 0 },
        tipo: { value: '', confidence: 0 },
        classificacao: { value: '', confidence: 0 },
        uva: { value: '', confidence: 0 },
        tamanho: { value: '', confidence: 0 },
        tampa: { value: '', confidence: 0 },
        harmonizacao: { values: [], confidence: 0 }
      }));
    }
  } catch (error) {
    console.error('Error generating wine attributes:', error);
    return produtos.map(() => ({
      id: '',
      title: '',
      pais: { value: '', confidence: 0 },
      tipo: { value: '', confidence: 0 },
      classificacao: { value: '', confidence: 0 },
      uva: { value: '', confidence: 0 },
      tamanho: { value: '', confidence: 0 },
      tampa: { value: '', confidence: 0 },
      harmonizacao: { values: [], confidence: 0 }
    }));
  }
}


export async function enhanceBeerProduct(beerInfo: BeerField, enhancementType: "description" | "tags" | "all" | "fields" | "complete"): Promise<{ 
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
  }
}> {
  try {
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
      }
    } = {};
    
    if (enhancementType === "description" || enhancementType === "all" || enhancementType === "complete") {
      result.description = await generateBeerDescription(beerInfo);
    }
    
    if (enhancementType === "tags" || enhancementType === "all" || enhancementType === "complete") {
      result.tags = await generateBeerTags(beerInfo);
    }
    
    if (enhancementType === "fields" || enhancementType === "complete") {
      result.fields = await generateBeerFields(beerInfo);
    }
    
    return result;
  } catch (error) {
    console.error('Error enhancing beer product:', error);
    return {};
  }
}