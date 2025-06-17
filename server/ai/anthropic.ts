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
import { generateWineAttributesPrompt, generateWineAttributesPromptSingle } from '../domain/prompts';
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
      throw jsonError;
    }
  } catch (error) {
    console.error('Error generating wine attributes:', error);
    throw error;
  }
}

export async function generateWineAttribute(produto: WineInput): Promise<WineAttributes> {
  const prompt = generateWineAttributesPromptSingle(produto);
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
    return {
      id: parsedResults.id,
      title: parsedResults.nome,
      country: { value: parsedResults.pais.value, confidence: parsedResults.pais.confidence },
      type: { value: parsedResults.tipo.value, confidence: parsedResults.tipo.confidence },
      classification: { value: parsedResults.classificacao.value, confidence: parsedResults.classificacao.confidence },
      grape_variety: { value: parsedResults.uva.value, confidence: parsedResults.uva.confidence },
      size: { value: parsedResults.tamanho.value, confidence: parsedResults.tamanho.confidence },
      closure: { value: parsedResults.tampa.value, confidence: parsedResults.tampa.confidence },
      pairings: { values: parsedResults.harmonizacao.values, confidence: parsedResults.harmonizacao.confidence },
      status: 'OK',
      confidence: null
    };
  } catch (jsonError) {
    console.error('Error parsing Anthropic response:', jsonError);
    throw jsonError;
  }
}