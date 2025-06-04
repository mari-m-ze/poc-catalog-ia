import requests
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

BRAVE_API_KEY = os.getenv("BRAVE_API_KEY")
OPENAI_API_KEY= os.getenv("BRAVE_API_KEY2")

def buscar_brave(query, num_results=50, market="pt-BR"):
    url = "https://api.search.brave.com/res/v1/web/search"
    headers = {
        "X-Subscription-Token": BRAVE_API_KEY
    }
    params = {
        "q": query,
        # "count": num_results,
        # "country": "BR",
        # "search_lang": "pt-br",
    }

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()

    snippets = []
    for result in data.get("web", {}).get("results", []):
        snippets.append(result.get("description", ""))

    return "\n\n".join(snippets)

def montar_prompt(nome_produto, contexto_web):
    return f"""
Você é um especialista em vinhos.

Com base no nome do produto e nas informações pesquisadas na internet, preencha os atributos abaixo.

Use APENAS os valores fornecidos em cada categoria. Se não encontrar um valor adequado, use string vazia ("").

Nome do produto: {nome_produto}

Informações da web:
{contexto_web}

Categorias disponíveis:
País de Origem: Argentina, Australia, Chile, França, Itália, Portugal, Espanha, Estados Unidos, África do Sul, Brasil, Nova Zelândia, Alemanha
Tipo de Vinho: Tinto, Branco, Rosé, Espumante, Sidra, Outros
Classificação: Seco, Suave, Demi-Sec, Brut
Uva: Cabernet Sauvignon, Merlot, Pinot Noir, Syrah, Malbec, Carmeneré, Tannat, Zinfandel, Chardonnay, Sauvignon Blanc, Riesling, Moscato, Blend, Outras
Tamanho: 750ml, 1L, 375ml, Outros
Tampa: Rolha, Rosca, Outra
Harmonização: Pizzas e Massas de Molho Vermelho, Carnes vermelhas, Queijos, Saladas e aperitivos, Carnes brancas, Frutos do mar, Carnes de caça, Risoto e Massas de Molho Branco, Pratos apimentados, Sobremesas

Retorne o seguinte JSON:

{{
  "pais": {{"value": "...", "confidence": 0-100}},
  "tipo": {{"value": "...", "confidence": 0-100}},
  "classificacao": {{"value": "...", "confidence": 0-100}},
  "uva": {{"value": "...", "confidence": 0-100}},
  "tamanho": {{"value": "...", "confidence": 0-100}},
  "tampa": {{"value": "...", "confidence": 0-100}},
  "harmonizacao": {{"values": ["..."], "confidence": 0-100}}
}}
"""

def chamar_openai(prompt):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    result = response.json()
    return result["choices"][0]["message"]["content"]

def gerar_atributos(nome_produto):
    print(f"Buscando informações sobre: {nome_produto}")
    contexto = buscar_brave(nome_produto)
    prompt = montar_prompt(nome_produto, contexto)
    resposta = chamar_openai(prompt)
    return resposta

# ✅ Exemplo de uso
if __name__ == "__main__":
    nome = "Bebida Alcoólica Mista de Vinho San Martin 750ml"
    resultado = gerar_atributos(nome)
    print("\nResultado:\n", resultado)
