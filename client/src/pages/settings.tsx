import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { SettingsPanel } from '@/components/settings-panel';

export default function Settings() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-semibold font-inter text-dark-gray">Configurações</h1>
            <p className="text-sm text-gray-500">Gerencie as configurações do sistema</p>
          </div>
        </div>
        
        <div className="p-8">
          <SettingsPanel />
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Sobre os provedores de IA</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-2">OpenAI</h3>
                <p className="text-gray-600 mb-4">
                  Utiliza os modelos GPT da OpenAI para gerar descrições e tags de produtos. 
                  Requer uma chave de API da OpenAI configurada como OPENAI_API_KEY.
                </p>
                <a 
                  href="https://platform.openai.com/signup" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-beer-gold hover:underline"
                >
                  Obter chave de API da OpenAI
                </a>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-2">Anthropic Claude</h3>
                <p className="text-gray-600 mb-4">
                  Utiliza os modelos Claude da Anthropic para gerar descrições e tags de produtos.
                  Requer uma chave de API da Anthropic configurada como ANTHROPIC_API_KEY.
                </p>
                <a 
                  href="https://console.anthropic.com/login" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-beer-gold hover:underline"
                >
                  Obter chave de API da Anthropic
                </a>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-2">Google Gemini</h3>
                <p className="text-gray-600 mb-4">
                  Utiliza os modelos Gemini do Google para gerar descrições e tags de produtos.
                  Requer uma chave de API do Google AI configurada como GEMINI_API_KEY.
                </p>
                <a 
                  href="https://ai.google.dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-beer-gold hover:underline"
                >
                  Obter chave de API do Google AI
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}