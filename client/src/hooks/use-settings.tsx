import { useQuery, useMutation } from '@tanstack/react-query';
import { AppSettings, AIProvider } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function useSettings() {
  // Buscar configurações
  const { 
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError,
  } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Falha ao buscar configurações');
      }
      return response.json() as Promise<AppSettings>;
    },
  });

  // Buscar lista de provedores de IA disponíveis
  const {
    data: aiProviders,
    isLoading: isLoadingProviders,
  } = useQuery({
    queryKey: ['/api/reference/ai-providers'],
    queryFn: async () => {
      const response = await fetch('/api/reference/ai-providers');
      if (!response.ok) {
        throw new Error('Falha ao buscar provedores de IA');
      }
      return response.json() as Promise<string[]>;
    },
  });

  // Verificar se a API key está configurada
  const checkApiKey = async (provider?: AIProvider) => {
    const url = provider 
      ? `/api/settings/check-api-key?provider=${provider}`
      : '/api/settings/check-api-key';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Falha ao verificar chave de API');
    }
    return response.json() as Promise<{ provider: string; hasKey: boolean }>;
  };

  // Mutação para atualizar configurações
  const { mutate: updateSettings, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: Partial<AppSettings>) => {
      return await apiRequest('PATCH', '/api/settings', updates);
    },
    onSuccess: () => {
      // Invalidar cache para recarregar as configurações
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  // Função para atualizar o provedor de IA
  const setAIProvider = (provider: AIProvider) => {
    updateSettings({ aiProvider: provider });
  };

  return {
    settings,
    aiProviders,
    isLoadingSettings,
    isLoadingProviders,
    settingsError,
    isUpdating,
    updateSettings,
    setAIProvider,
    checkApiKey,
  };
}