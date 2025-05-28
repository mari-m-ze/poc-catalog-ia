import { GoogleGenerativeAI } from '@google/generative-ai';
import { marcas, tamanhos, embalagens, classificacoes, teoresAlcoolicos, origens, retornaveis, tipos } from '@shared/schema';
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
} from './domain/wine';
import { validateEnum, validateMultipleEnum, validateConfidence } from './domain/helpers';
import { generateWineAttributesPrompt } from './domain/prompts';

// O modelo mais recente é o gemini-pro
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    Por favor, crie uma descrição de produto comercial para a seguinte cerveja:
    
    Nome: ${beerInfo.nome_sku}
    Marca: ${beerInfo.marca}
    Tamanho: ${beerInfo.tamanho}
    Embalagem: ${beerInfo.embalagem}
    Classificação: ${beerInfo.classificacao}
    Teor Alcoólico: ${beerInfo.teor_alcoolico}
    Origem: ${beerInfo.origem}
    Retornável: ${beerInfo.retornavel}
    Tipo: ${beerInfo.tipo || 'Não especificado'}
    
    A descrição deve ter entre 50 e 100 palavras e destacar características sensoriais como sabor, aroma, cor, corpo 
    e ocasiões ideais para consumo. Use linguagem persuasiva e comercial. Não mencione explicitamente 
    "Esta cerveja..." e evite começar com "A [marca]...". Formato direto e persuasivo.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao gerar descrição de cerveja:', error);
    return 'Não foi possível gerar uma descrição. Por favor, tente novamente mais tarde.';
  }
}

export async function generateBeerTags(beerInfo: BeerField): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    Por favor, gere até 10 tags de busca relevantes para a seguinte cerveja:
    
    Nome: ${beerInfo.nome_sku}
    Marca: ${beerInfo.marca}
    Tamanho: ${beerInfo.tamanho}
    Embalagem: ${beerInfo.embalagem}
    Classificação: ${beerInfo.classificacao}
    Teor Alcoólico: ${beerInfo.teor_alcoolico}
    Origem: ${beerInfo.origem}
    Retornável: ${beerInfo.retornavel}
    Tipo: ${beerInfo.tipo || 'Não especificado'}
    
    As tags devem ser relevantes para e-commerce e melhorar a descoberta do produto em buscas. 
    Responda apenas com as tags separadas por vírgula, sem numeração ou explicação.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao gerar tags de cerveja:', error);
    return 'cerveja';
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
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    Com base neste nome de produto de cerveja, determine os valores mais apropriados para os campos de categorização.
    Retorne APENAS um objeto JSON com estes campos (somente aqueles que você puder determinar com alta confiança).
    
    Nome do Produto: ${beerInfo.nome_sku}
    
    IMPORTANTE: 
    1. O tamanho do produto geralmente está indicado no nome do produto (nome_sku). 
       Procure por números seguidos de "ml" ou "L" no nome do produto para determinar o tamanho correto.
    
    2. A embalagem deve ser determinada com base no tamanho e no nome do produto:
       - Lata: Tamanhos comuns são 269ml, 350ml, 473ml
       - Vidro: Tamanhos comuns são 210ml, 300ml, 330ml, 355ml, 600ml, 1L
       - Plástico: Reservado para casos específicos de garrafas PET
       - Barril: Avaliar de acordo com o nome do produto que pode ter dicas sobre a embalagem
       - Use "Outros" para tamanhos que não se encaixem claramente nas categorias anteriores
    
    Opções disponíveis para cada categoria:
    
    MARCA: ${marcas.join(", ")}
    
    TAMANHO: ${tamanhos.join(", ")}
    
    EMBALAGEM: ${embalagens.join(", ")}
    
    CLASSIFICAÇÃO: ${classificacoes.join(", ")}
    
    TEOR ALCOÓLICO: ${teoresAlcoolicos.join(", ")}
    
    ORIGEM: ${origens.join(", ")}
    
    RETORNÁVEL: ${retornaveis.join(", ")}
    
    TIPO: ${tipos.join(", ")}
    
    Retorne APENAS o JSON puro sem explicações, introduções ou contexto.
    Use SOMENTE os valores exatos das listas fornecidas.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      // Tentar extrair apenas o objeto JSON eliminando qualquer texto adicional
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // Validar e garantir que todos os campos são opções válidas
        if (!result.marca || !marcas.includes(result.marca)) result.marca = marcas[0];
        if (!result.tamanho || !tamanhos.includes(result.tamanho)) result.tamanho = tamanhos[0];
        if (!result.embalagem || !embalagens.includes(result.embalagem)) result.embalagem = embalagens[0];
        if (!result.classificacao || !classificacoes.includes(result.classificacao)) result.classificacao = classificacoes[0];
        if (!result.teor_alcoolico || !teoresAlcoolicos.includes(result.teor_alcoolico)) result.teor_alcoolico = teoresAlcoolicos[0];
        if (!result.origem || !origens.includes(result.origem)) result.origem = origens[0];
        if (!result.retornavel || !retornaveis.includes(result.retornavel)) result.retornavel = retornaveis[0];
        if (!result.tipo || !tipos.includes(result.tipo)) result.tipo = tipos[0];
        
        return result;
      }
      return JSON.parse(text);
    } catch (jsonError) {
      console.error('Erro ao parsear JSON do Gemini:', jsonError);
      // Retorna valores padrão como fallback
      return {
        marca: beerInfo.marca || marcas[0],
        tamanho: beerInfo.tamanho || tamanhos[0],
        embalagem: beerInfo.embalagem || embalagens[0],
        classificacao: beerInfo.classificacao || classificacoes[0],
        teor_alcoolico: beerInfo.teor_alcoolico || teoresAlcoolicos[0],
        origem: beerInfo.origem || origens[0],
        retornavel: beerInfo.retornavel || retornaveis[0],
        tipo: beerInfo.tipo || tipos[0]
      };
    }
  } catch (error) {
    console.error('Erro ao gerar campos de cerveja:', error);
    // Retorna valores padrão como fallback
    return {
      marca: beerInfo.marca || marcas[0],
      tamanho: beerInfo.tamanho || tamanhos[0],
      embalagem: beerInfo.embalagem || embalagens[0],
      classificacao: beerInfo.classificacao || classificacoes[0],
      teor_alcoolico: beerInfo.teor_alcoolico || teoresAlcoolicos[0],
      origem: beerInfo.origem || origens[0],
      retornavel: beerInfo.retornavel || retornaveis[0],
      tipo: beerInfo.tipo || tipos[0]
    };
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
    const response = result.response;
    const content = response.text();
    
    if (!content) {
      throw new Error('No content in response');
    }

    try {
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const results = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(results)) {
        throw new Error('Response is not an array');
      }

      // Map each result to its attributes
      return results.map(result => ({
        id: result.id,
        title: result.title,
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
      console.error('Error parsing Gemini response:', jsonError);
      // Return default values if there's an error
      return produtos.map(produto => ({
        id: produto.id,
        title: produto.title,
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
    return produtos.map(produto => ({
      id: produto.id,
      title: produto.title,
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
    console.error('Erro ao aprimorar produto de cerveja:', error);
    return {};
  }
}