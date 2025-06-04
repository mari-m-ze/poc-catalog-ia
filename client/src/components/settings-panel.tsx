import React, { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { AIProvider } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export function SettingsPanel() {
  const { 
    settings, 
    aiProviders,
    isLoadingSettings,
    isLoadingProviders,
    updateSettings,
    isUpdating,
    checkApiKey
  } = useSettings();
  
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | ''>('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'available' | 'unavailable' | null>(null);
  const [confidence, setConfidence] = useState<number>(50);
  
  // Quando as configurações são carregadas, atualize o estado local
  useEffect(() => {
    if (settings) {
      setSelectedProvider(settings.aiProvider);
      setConfidence(settings.confidence || 50);
      checkCurrentApiKey(settings.aiProvider);
    }
  }, [settings]);
  
  // Verifica se a API key atual está configurada
  const checkCurrentApiKey = async (provider: AIProvider) => {
    try {
      setApiKeyStatus('checking');
      const result = await checkApiKey(provider);
      setApiKeyStatus(result.hasKey ? 'available' : 'unavailable');
    } catch (error) {
      setApiKeyStatus('unavailable');
      console.error('Erro ao verificar chave de API:', error);
    }
  };
  
  // Atualiza o provedor de IA quando o usuário altera a seleção
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value as AIProvider);
    
    updateSettings({ aiProvider: value as AIProvider });
    
    // Verificar se a API key está disponível para o novo provedor
    checkCurrentApiKey(value as AIProvider);
    
    toast({
      title: 'Configurações atualizadas',
      description: `Provedor de IA alterado para ${value}`,
    });
  };
  
  // Exibe o status da chave de API
  const renderApiKeyStatus = () => {
    if (!selectedProvider) return null;
    
    if (apiKeyStatus === 'checking') {
      return (
        <div className="flex items-center text-gray-500">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Verificando chave de API...
        </div>
      );
    }
    
    if (apiKeyStatus === 'available') {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-2" />
          Chave de API configurada
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-amber-600">
        <AlertTriangle className="w-4 h-4 mr-2" />
        <span>
          Chave de API não configurada. 
          {selectedProvider === 'openai' && 'Configure OPENAI_API_KEY nas variáveis de ambiente.'}
          {selectedProvider === 'anthropic' && 'Configure ANTHROPIC_API_KEY nas variáveis de ambiente.'}
          {selectedProvider === 'gemini' && 'Configure GEMINI_API_KEY nas variáveis de ambiente.'}
        </span>
      </div>
    );
  };
  
  // Add confidence change handler
  const handleConfidenceChange = (value: number[]) => {
    const newConfidence = value[0];
    setConfidence(newConfidence);
    
    updateSettings({ confidence: newConfidence });
    
    toast({
      title: 'Configurações atualizadas',
      description: `Limite de confiança alterado para ${newConfidence}%`,
    });
  };
  
  if (isLoadingSettings || isLoadingProviders) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Carregando configurações...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>Configure o provedor de IA para geração de conteúdo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <label className="text-sm font-medium">Provedor de IA</label>
            <Select
              disabled={isUpdating}
              value={selectedProvider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um provedor de IA" />
              </SelectTrigger>
              <SelectContent>
                {aiProviders?.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider === 'openai' && 'OpenAI'}
                    {provider === 'anthropic' && 'Anthropic Claude'}
                    {provider === 'gemini' && 'Google Gemini'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm mt-2">
              {renderApiKeyStatus()}
            </div>
          </div>
          <div className="grid gap-3">
            <Label className="text-sm font-medium">
              Limite de Confiança Mínima: {confidence}%
            </Label>
            <Slider
              value={[confidence]}
              onValueChange={handleConfidenceChange}
              max={100}
              min={0}
              step={5}
              disabled={isUpdating}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Apenas atributos com confiança igual ou superior a {confidence}% serão aceitos
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="text-xs text-gray-500">
          Para usar as funcionalidades de IA, você precisa configurar as chaves de API correspondentes nas variáveis de ambiente.
        </div>
      </CardFooter>
    </Card>
  );
}