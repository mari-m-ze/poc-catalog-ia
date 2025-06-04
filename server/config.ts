import { AppSettings, AIProvider } from '@shared/schema';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o equivalente ao __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, '..', 'app-config.json');

// Valores padrão para as configurações
const defaultConfig: AppSettings = {
  aiProvider: 'anthropic',
  language: 'pt',
  confidence: 50
};

// Carrega as configurações do arquivo ou usa os valores padrão
function loadConfig(): AppSettings {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configRaw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(configRaw) as AppSettings;
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
  
  // Se não conseguir carregar, salva e retorna os valores padrão
  saveConfig(defaultConfig);
  return defaultConfig;
}

// Salva as configurações no arquivo
function saveConfig(config: AppSettings): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
}

// Atualiza uma configuração específica
function updateConfig(updates: Partial<AppSettings>): AppSettings {
  const currentConfig = loadConfig();
  const newConfig = { ...currentConfig, ...updates };
  saveConfig(newConfig);
  return newConfig;
}

// Retorna o provedor de IA configurado
function getAIProvider(): AIProvider {
  return loadConfig().aiProvider;
}

// Verifica se a API key necessária está disponível
function hasRequiredAPIKey(provider: AIProvider = loadConfig().aiProvider): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'gemini':
      return !!process.env.GEMINI_API_KEY;
    default:
      return false;
  }
}

export const config = {
  load: loadConfig,
  save: saveConfig,
  update: updateConfig,
  getAIProvider,
  hasRequiredAPIKey
};