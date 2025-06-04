import OpenAI from 'openai';
import {
  marcas,
  tamanhos,
  embalagens,
  classificacoes,
  teoresAlcoolicos,
  origens,
  retornaveis,
  tipos
} from '@shared/schema';
import {
  Countries,
  WineTypes,
  Classifications,
  GrapeVarieties,
  Sizes,
  Closures,
  WinePairings,
  type WineAttributes,
  type WineAttributeWithConfidence,
  type WineInput
} from '../domain/wine';
import { validateEnum, validateMultipleEnum, validateConfidence } from '../domain/helpers';
import { generateWineAttributesPrompt, generateWineAttributesPromptSingle } from '../domain/prompts';
import { log } from '../vite';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

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

export async function generateWineAttribute(produto: WineInput, confidence: number = 70): Promise<WineAttributes> {
  try {
    const prompt = generateWineAttributesPromptSingle(produto, confidence);
    log('blalbla', prompt);
    const completion = await openai.chat.completions.create({
      // model: "gpt-4o",
      model: "gpt-4o-search-preview",
      messages: [
        {
          "role": "system",
          "content": "Você é um especialista em vinhos com acesso a uma base ampla de conhecimento e dados de produtos incluse busca na internet. Use inferência com base no nome do produto e padrões de mercado para preencher os atributos com alta confiança."
        },
        { role: "user", content: prompt }],
      // temperature: 0.3, // Lower temperature for more consistent results
      // response_format: { type: "json_object" }// não funciona para o search preview
    });
    log('OpenAI completion:', JSON.stringify(completion, null, 2));

    const content = completion.choices[0].message.content;
    if (!content) {
      log('ERROR! No content in response');
      return {
        id: produto.id.toString(),
        nome: produto.nome,
        pais: { value: '', confidence: 0 },
        tipo: { value: '', confidence: 0 },
        classificacao: { value: '', confidence: 0 },
        uva: { value: '', confidence: 0 },
        tamanho: { value: '', confidence: 0 },
        tampa: { value: '', confidence: 0 },
        harmonizacao: { values: [], confidence: 0 },
        status: 'Error'
      }
    }

    const result = JSON.parse(content);
    log('Parsed result:', JSON.stringify(result, null, 2));

    // Validate and ensure each field matches the enum values
    return {
      id: result.id,
      nome: result.nome,
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
      },
      status: 'OK'
    };
  } catch (error: unknown) {
    log('ERROR!', error instanceof Error ? error.message : String(error));
    // Return default values if there's an error
    return {
      id: produto.id.toString(),
      nome: produto.nome,
      pais: { value: '', confidence: 0 },
      tipo: { value: '', confidence: 0 },
      classificacao: { value: '', confidence: 0 },
      uva: { value: '', confidence: 0 },
      tamanho: { value: '', confidence: 0 },
      tampa: { value: '', confidence: 0 },
      harmonizacao: { values: [], confidence: 0 },
      status: 'Error'
    };
  }
}
export async function generateWineAttributes(produtos: WineInput[]): Promise<WineAttributes[]> {
  try {
    const prompt = generateWineAttributesPrompt(produtos);
    log('blalbla', prompt);
    const completion = await openai.chat.completions.create({
      // model: "gpt-4o",
      model: "gpt-4o-search-preview",
      /**
       * The messages to be sent to the AI model. The first message is a
       * "system" message that provides context and instructions for the AI
       * model. The second message is a "user" message that contains the
       * prompt to be completed by the AI model.
       */
      messages: [
        {
          "role": "system",
          "content": "Você é um especialista em vinhos com acesso a uma base ampla de conhecimento e dados de produtos incluse busca na internet. Use inferência com base no nome do produto e padrões de mercado para preencher os atributos com alta confiança."
        },
        { role: "user", content: prompt }],
      // temperature: 0.3, // Lower temperature for more consistent results
      // response_format: { type: "json_object" }// não funciona para o search preview
    });
    log('OpenAI completion:', JSON.stringify(completion, null, 2));

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    const results = JSON.parse(content);
    log('Parsed results:', JSON.stringify(results, null, 2));
    if (!Array.isArray(results)) {
      throw new Error('Response is not an array');
    }

    // Validate and ensure each field matches the enum values for each product
    return results.map(result => ({
      id: result.id,
      nome: result.nome,
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
      },
      status: 'OK'
    }));

  } catch (error: unknown) {

    console.error('Error generating wine attributes:', error instanceof Error ? error.message : String(error));
    // Return default values if there's an error
    return produtos.map((produto) => ({
      id: produto.id.toString(),
      nome: produto.nome,
      pais: { value: '', confidence: 0 },
      tipo: { value: '', confidence: 0 },
      classificacao: { value: '', confidence: 0 },
      uva: { value: '', confidence: 0 },
      tamanho: { value: '', confidence: 0 },
      tampa: { value: '', confidence: 0 },
      harmonizacao: { values: [], confidence: 0 },
      status: 'Error'
    }));
  }
}


