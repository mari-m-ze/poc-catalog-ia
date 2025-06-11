import {
  Countries,
  WineTypes,
  Classifications,
  GrapeVarieties,
  Sizes,
  Closures,
  WinePairings,
} from './wine';

import { WineInput } from './wine';

const CONFIDENCE = 50;

export function generateWineAttributesPromptSingle(product: WineInput, confidence: number = CONFIDENCE): string {
  return `
    Para o produto abaixo use a internet (ou base de dados confiável) para identificar os atributos solicitados. Aplique máxima profundidade de busca. 

Use APENAS os valores fornecidos em cada categoria com nível de confiabilidade acima de ${confidence}%. 'Outras', 'Outros', 'Outra', 'Outro' podem ser utilizados quando não se encaixarem nos demais valores e tiverem essa confiança de ${confidence}% ou mais. Se não tiver confiança de ${confidence}% ou mais, retorne uma string vazia ("").

Para o campo harmonização, é possível retornar múltiplos valores da lista fornecida.
Para o campo uva, se for uma mistura de uvas, retorne 'Blend'.    
Para cada atributo, forneça um nível de confiança em porcentagem (0 a 100 retornando como número e não string), onde:
- 0% - Nenhuma confiança (chute)
- 30% - Baixa confiança (pouca certeza)
- 50% - Média confiança (provável)
- 70% - Alta confiança (muito provável)
- 100% - Certeza absoluta (explícito no nome ou fonte confiável)

    Produto: [ID: ${product.id}] Nome:${product.nome} 
    
    Categorias disponíveis:
    
    País de Origem: ${Countries.join(', ')}
    Tipo de Vinho: ${WineTypes.join(', ')}
    Classificação: ${Classifications.join(', ')}
    Uva: ${GrapeVarieties.join(', ')} (use "Blend" para misturas de uvas mesmo que não sejam uvas listadas anteriormente)
    Tamanho: ${Sizes.join(', ')}
    Tampa: ${Closures.join(', ')}
    Harmonização: ${WinePairings.join(', ')}
    
    Retorne APENAS o objeto JSON com os seguintes campos:
  {
    "id": "o número do id do produto fornecido entre colchetes (exemplo: 1, 2, 3, etc.)",
    "nome": "nome do produto analisado",
    "pais": {
      "value": "país de origem do vinho",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "tipo": {
      "value": "tipo do vinho",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "classificacao": {
      "value": "classificação do vinho",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "uva": {
      "value": "variedade da uva",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "tamanho": {
      "value": "tamanho da garrafa",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "tampa": {
      "value": "tipo de tampa",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "harmonizacao": {
      "values": ["harmonizações sugeridas"],
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    }
  }

IMPORTANTE: Retorne SOMENTE o objeto JSON diretamente, sem explicações, sem texto adicional, e sem marcar o código com blocos de markdown como \`\`\`json. O output deve ser um JSON puro, começando com { e terminando com }.

    
  `;
}
export function generateWineAttributesPrompt(produtos: WineInput[], confidence: number = CONFIDENCE): string {
  return `
    Para cada produto listado abaixo, analise individualmente como se fosse o único item no prompt. Use a internet (ou base de dados confiável) para identificar os atributos solicitados. Aplique máxima profundidade e precisão em cada item. Não compartilhe ou reutilize inferências entre produtos. Avalie cada produto de forma isolada, com o mesmo rigor que seria usado se estivesse sendo enviado sozinho.

Use APENAS os valores fornecidos em cada categoria com nível de confiabilidade acima de ${confidence}%. 'Outras', 'Outros', 'Outra', 'Outro' podem ser utilizados quando não se encaixarem nos demais valores e tiverem essa confiança de ${confidence}% ou mais. Se não tiver confiança de ${confidence}% ou mais, retorne uma string vazia ("").

Para o campo harmonização, é possível retornar múltiplos valores da lista fornecida.
Para o campo uva, se for uma mistura de uvas, retorne 'Blend'.    
Para cada atributo, forneça um nível de confiança em porcentagem (0 a 100), onde:
- 0% - Nenhuma confiança (chute)
- 30% - Baixa confiança (pouca certeza)
- 50% - Média confiança (provável)
- 70% - Alta confiança (muito provável)
- 100% - Certeza absoluta (explícito no nome ou fonte confiável)

   
    Produtos:
    ${produtos.map((produto, index) => `${index + 1}. [ID: ${produto.id}] ${produto.nome}`).join('\n')}
    
    Categorias disponíveis:
    
    País de Origem: ${Countries.join(', ')}
    Tipo de Vinho: ${WineTypes.join(', ')}
    Classificação: ${Classifications.join(', ')}
    Uva: ${GrapeVarieties.join(', ')} (use "Blend" para misturas de uvas mesmo que não sejam uvas listadas anteriormente)
    Tamanho: ${Sizes.join(', ')}
    Tampa: ${Closures.join(', ')}
    Harmonização: ${WinePairings.join(', ')}
    
    Retorne APENAS o array de objetos JSON com os seguintes campos:
[
  {
    "id": "id do produto fornecido entre colchetes",
    "nome": "nome do produto analisado",
    "pais": {
      "value": "país de origem do vinho",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "tipo": {
      "value": "tipo do vinho",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "classificacao": {
      "value": "classificação do vinho",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "uva": {
      "value": "variedade da uva",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "tamanho": {
      "value": "tamanho da garrafa",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "tampa": {
      "value": "tipo de tampa",
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    },
    "harmonizacao": {
      "values": ["harmonizações sugeridas"],
      "confidence": "nível de confiança de 0 a 100 (em porcentagem)"
    }
  }
]
IMPORTANTE: Retorne SOMENTE o objeto JSON diretamente, sem explicações, sem texto adicional, e sem marcar o código com blocos de markdown como \`\`\`json. O output deve ser um JSON puro, começando com { e terminando com }.

    
  `;
}


export function generateWineAttributesPromptbkp(produtos: WineInput[]): string {
  return `
    Pesquisar o nome do produto de vinho a seguir e gerar os atributos listados abaixo.
    Use APENAS os valores fornecidos em cada categoria com nível de confiabilidade acima de 90%. Se não encontrar um valor adequado, retorne uma string vazia ("").    
    Para o campo harmonização, é possível retornar múltiplos valores da lista fornecida.
    Para o campo uva, se for uma mistura de uvas pode retornar 'Blend'.
    'Outras', 'Outros', 'Outra', 'Outro' podem ser utilizados quando não se encaixar nos demais valores.
    Para cada atributo, forneça um nível de confiança em porcentagem (0 a 100), onde:
    0% - Nenhuma confiança (chute)
    30% - Baixa confiança (pouca certeza)
    50% - Média confiança (provável)
    70% - Alta confiança (muito provável)
    100% - Certeza absoluta (explícito no nome)
    
    Produtos:
    ${produtos.map((produto, index) => `${index + 1}. [ID: ${produto.id}] ${produto.nome}`).join('\n')}
    
    Categorias disponíveis:
    
    País de Origem: ${Countries.join(', ')}
    Tipo de Vinho: ${WineTypes.join(', ')}
    Classificação: ${Classifications.join(', ')}
    Uva: ${GrapeVarieties.join(', ')} (use "Blend" para misturas de uvas mesmo que não sejam uvas listadas anteriormente)
    Tamanho: ${Sizes.join(', ')}
    Tampa: ${Closures.join(', ')}
    Harmonização: ${WinePairings.join(', ')}
  `;
}