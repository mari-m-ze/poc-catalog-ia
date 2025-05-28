import Anthropic from '@anthropic-ai/sdk';
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
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
import { log } from './vite';
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
    
    Crie uma descrição de produto com no máximo 70 palavras, usando linguagem simples, acessível e direta, sem termos técnicos ou metáforas. Use voz ativa, frases curtas e objetivas, destacando as principais características e benefícios do produto com clareza. Adote um tom amigável, confiante e sem exageros. Evite redundâncias, respeite a lógica da jornada da pessoa e finalize com uma chamada leve para ação. Não mencione explicitamente 
    "Esta cerveja..." e evite começar com "A [marca]...". Traga somente a descrição sem acrescentar nada.
    `;

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (error) {
    console.error('Error generating beer description:', error);
    return 'Não foi possível gerar uma descrição. Por favor, tente novamente mais tarde.';
  }
}

export async function generateBeerTags(beerInfo: BeerField): Promise<string> {
  try {
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

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (error) {
    console.error('Error generating beer tags:', error);
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
    const prompt = `
    Por favor, com base no nome do produto de cerveja a seguir, escolha os valores mais adequados para cada campo de categorização,
    usando SOMENTE as opções fornecidas em cada categoria.
    
    Nome do produto: ${beerInfo.nome_sku}
    
    IMPORTANTE: 
    1. O tamanho do produto geralmente está indicado no nome do produto (nome_sku). 
       Procure por números seguidos de "ml" ou "L" no nome do produto para determinar o tamanho correto.
    
    2. A embalagem deve ser determinada com base no tamanho e no nome do produto:
       - Lata: Tamanhos comuns são 269ml, 350ml, 473ml
       - Vidro: Tamanhos comuns são 210ml, 300ml, 330ml, 355ml, 600ml, 1L
       - Plástico: Tamanhos acima de 1L
       - Barril: Avaliar de acordo com o nome do produto que pode ter dicas sobre a embalagem
       - Use "Outros" para tamanhos que não se encaixam claramente nas categorias anteriores
    
    Opções disponíveis para cada categoria:
    
    MARCA: ${marcas.join(", ")}
    
    TAMANHO: ${tamanhos.join(", ")}
    
    EMBALAGEM: ${embalagens.join(", ")}
    
    CLASSIFICAÇÃO: ${classificacoes.join(", ")}
    
    TEOR ALCOÓLICO: ${teoresAlcoolicos.join(", ")}
    
    ORIGEM: ${origens.join(", ")}
    
    RETORNÁVEL: ${retornaveis.join(", ")}
    
    TIPO: ${tipos.join(", ")}
    
    Sua resposta deve estar no formato JSON exato, sem explicações adicionais:
    {
      "marca": "valor selecionado da lista de marcas",
      "tamanho": "valor selecionado da lista de tamanhos",
      "embalagem": "valor selecionado da lista de embalagens",
      "classificacao": "valor selecionado da lista de classificações",
      "teor_alcoolico": "valor selecionado da lista de teores alcoólicos",
      "origem": "valor selecionado da lista de origens",
      "retornavel": "valor selecionado da lista de retornáveis",
      "tipo": "valor selecionado da lista de tipos"
    }
    
    Importante: selecione apenas valores que estão exatamente nas listas fornecidas.
    `;

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      system: "Você é um assistente especializado em categorização de produtos de cerveja. Responda apenas com o formato JSON solicitado, sem texto adicional."
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    log('Anthropic completion:', JSON.stringify(message, null, 2));
    try {
      // Extrair o JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const result = JSON.parse(jsonString);
        
        // Validar que todos os campos necessários estão presentes e são válidos
        if (!result.marca || !marcas.includes(result.marca)) result.marca = marcas[0];
        if (!result.tamanho || !tamanhos.includes(result.tamanho)) result.tamanho = tamanhos[0];
        if (!result.embalagem || !embalagens.includes(result.embalagem)) result.embalagem = embalagens[0];
        if (!result.classificacao || !classificacoes.includes(result.classificacao)) result.classificacao = classificacoes[0];
        if (!result.teor_alcoolico || !teoresAlcoolicos.includes(result.teor_alcoolico)) result.teor_alcoolico = teoresAlcoolicos[0];
        if (!result.origem || !origens.includes(result.origem)) result.origem = origens[0];
        if (!result.retornavel || !retornaveis.includes(result.retornavel)) result.retornavel = retornaveis[0];
        if (!result.tipo || !tipos.includes(result.tipo)) result.tipo = tipos[0];
        
        return result;
      } else {
        throw new Error("Could not extract JSON from response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
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
    console.error('Error generating beer fields:', error);
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