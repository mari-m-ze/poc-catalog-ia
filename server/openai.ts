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
} from './domain/wine';
import { validateEnum, validateMultipleEnum, validateConfidence } from './domain/helpers';
import { generateWineAttributesPrompt, generateWineAttributesPromptSingle } from './domain/prompts';
import { log } from './vite';

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

export async function generateBeerDescription(beerInfo: BeerField): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a beer expert who can write compelling, accurate, and detailed product descriptions for beer products. Your descriptions should be appealing for e-commerce use, highlighting the beer's key characteristics in 3-4 sentences."
        },
        {
          role: "user",
          content: `Create a beer description for the following product:
            Name: ${beerInfo.nome_sku}
            Brand: ${beerInfo.marca}
            Size: ${beerInfo.tamanho}
            Packaging: ${beerInfo.embalagem}
            Classification: ${beerInfo.classificacao}
            Alcohol Content: ${beerInfo.teor_alcoolico}
            Origin: ${beerInfo.origem}
            Returnable: ${beerInfo.retornavel}
            Type: ${beerInfo.tipo || 'Not specified'}
            
            Please provide only the description text with no additional commentary.`
        }
      ],
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating beer description:", error);
    throw new Error("Failed to generate beer description");
  }
}

export async function generateBeerTags(beerInfo: BeerField): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a beer tag generator for e-commerce. Generate at least 15 relevant search tags for beer products, including common misspellings and related terms. Return tags as a comma-separated list with no additional text."
        },
        {
          role: "user",
          content: `Generate search tags for this beer product:
            Name: ${beerInfo.nome_sku}
            Brand: ${beerInfo.marca}
            Size: ${beerInfo.tamanho}
            Packaging: ${beerInfo.embalagem}
            Classification: ${beerInfo.classificacao}
            Alcohol Content: ${beerInfo.teor_alcoolico}
            Origin: ${beerInfo.origem}
            Returnable: ${beerInfo.retornavel}
            Type: ${beerInfo.tipo || 'Not specified'}
            
            Return only the comma-separated list of tags.`
        }
      ],
      response_format: { type: "text" }
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating beer tags:", error);
    throw new Error("Failed to generate beer tags");
  }
}

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
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a beer categorization expert. Analyze the beer name and determine the most appropriate values for each field, using ONLY the provided options."
        },
        {
          role: "user",
          content: `Categorize this beer product using ONLY the provided options for each field:
            
            Product Name: ${beerInfo.nome_sku}
            
            Available options for each field:
            
            Brand: ${marcas.join(', ')}
            Size: ${tamanhos.join(', ')}
            Packaging: ${embalagens.join(', ')}
            Classification: ${classificacoes.join(', ')}
            Alcohol Content: ${teoresAlcoolicos.join(', ')}
            Origin: ${origens.join(', ')}
            Returnable: ${retornaveis.join(', ')}
            Type: ${tipos.join(', ')}
            
            Return ONLY a JSON object with these fields (only include fields you can determine with high confidence).
            Do not include any explanations or additional text.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    log('OpenAI completion:', JSON.stringify(response, null, 2));
    if (!content) {
      throw new Error('No content in response');
    }

    const result = JSON.parse(content);

    // Validate each field against the allowed values
    return {
      marca: validateEnum(result.marca, marcas),
      tamanho: validateEnum(result.tamanho, tamanhos),
      embalagem: validateEnum(result.embalagem, embalagens),
      classificacao: validateEnum(result.classificacao, classificacoes),
      teor_alcoolico: validateEnum(result.teor_alcoolico, teoresAlcoolicos),
      origem: validateEnum(result.origem, origens),
      retornavel: validateEnum(result.retornavel, retornaveis),
      tipo: validateEnum(result.tipo, tipos)
    };

  } catch (error) {
    console.error("Error generating beer fields:", error);
    throw new Error("Failed to generate beer fields");
  }
}

export async function enhanceBeerProduct(beerInfo: BeerField, enhancementType: "description" | "tags" | "all" | "fields" | "complete"): Promise<{
  description?: string;
  tags?: string;
  marca?: string;
  tamanho?: string;
  embalagem?: string;
  classificacao?: string;
  teor_alcoolico?: string;
  origem?: string;
  retornavel?: string;
  tipo?: string;
}> {
  try {
    const result: {
      description?: string;
      tags?: string;
      marca?: string;
      tamanho?: string;
      embalagem?: string;
      classificacao?: string;
      teor_alcoolico?: string;
      origem?: string;
      retornavel?: string;
      tipo?: string;
    } = {};

    if (enhancementType === "description" || enhancementType === "all" || enhancementType === "complete") {
      result.description = await generateBeerDescription(beerInfo);
    }

    if (enhancementType === "tags" || enhancementType === "all" || enhancementType === "complete") {
      result.tags = await generateBeerTags(beerInfo);
    }

    if (enhancementType === "fields" || enhancementType === "complete") {
      const fields = await generateBeerFields(beerInfo);
      Object.assign(result, fields);
    }

    return result;
  } catch (error) {
    console.error("Error enhancing beer product:", error);
    throw new Error("Failed to enhance beer product");
  }
}

export async function generateWineAttribute(produto: WineInput): Promise<WineAttributes> {
  try {
    const prompt = generateWineAttributesPromptSingle(produto);
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
      }
    };
  } catch (error) {
    console.error('Error generating wine attributes:', error);
    // Return default values if there's an error
    return {
      id: '',
      nome: '',
      pais: { value: '', confidence: 0 },
      tipo: { value: '', confidence: 0 },
      classificacao: { value: '', confidence: 0 },
      uva: { value: '', confidence: 0 },
      tamanho: { value: '', confidence: 0 },
      tampa: { value: '', confidence: 0 },
      harmonizacao: { values: [], confidence: 0 }
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
      }
    }));

  } catch (error) {
    console.error('Error generating wine attributes:', error);
    // Return default values if there's an error
    return produtos.map(() => ({
      id: '',
      nome: '',
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


