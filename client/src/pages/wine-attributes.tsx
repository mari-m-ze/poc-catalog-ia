import React, { useState, useMemo } from 'react';
import { Sidebar } from '../components/sidebar';
import { FileInput } from '../components/ui/file-input';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Download, FileDown, Loader2, Eye, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { DataTable } from '../components/ui/data-table';
import { useSettings } from '@/hooks/use-settings';

// Wine attributes type based on the server structure
type WineAttributes = {
  id: number;
  title: string;
  status: string;
  country: { value: string; confidence: number };
  type: { value: string; confidence: number };
  classification: { value: string; confidence: number };
  grape_variety: { value: string; confidence: number };
  size: { value: string; confidence: number };
  closure: { value: string; confidence: number };
  pairings: { values: string[]; confidence: number };
  confidence: number|null;
};

export function WineAttributesPage() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [wineAttributes, setWineAttributes] = useState<WineAttributes[]>([]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum arquivo selecionado',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: 'Erro',
        description: 'Por favor, faça upload de um arquivo CSV',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setDownloadUrl(null);
    setWineAttributes([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/wines/attributes/process-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao processar arquivo');
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      setWineAttributes(data.attributes || []);
      
      toast({
        title: 'Sucesso',
        description: `${data.totalProcessed || data.attributes?.length || 0} produtos processados.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar arquivo',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to calculate average confidence
  const calculateAverageConfidence = (item: WineAttributes): number => {
    const confidences = [
      item.country.confidence,
      item.type.confidence,
      item.classification.confidence,
      item.grape_variety.confidence,
      item.size.confidence,
      item.closure.confidence,
      item.pairings.confidence
    ];
    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    return Math.round(average);
  };

  // Function to get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    if (confidence >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Adicionar função para verificar baixa confiança
  const isLowConfidence = (item: WineAttributes): boolean => {
    const configuredConfidence = settings?.confidence ?? 70;
    const itemConfidence = item.confidence ?? calculateAverageConfidence(item);
    return itemConfidence < configuredConfidence;
  };

  const tableColumns = [
    {
      id: 'id',
      header: 'id',
      sortable: true,
      cell: (item: WineAttributes) => (
        <div className="font-medium">{item.id}</div>
      ),
    },
    {
      id: 'nome',
      header: 'Nome do Vinho',
      sortable: true,
      cell: (item: WineAttributes) => (
        <div className="font-medium">{item.title}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (item: WineAttributes) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          item.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      id: 'confidence',
      header: 'Confiança Média',
      sortable: true,
      cell: (item: WineAttributes) => {
        const avgConfidence = item.confidence ?? calculateAverageConfidence(item);
        const configuredConfidence = settings?.confidence ?? 70;
        const isLow = avgConfidence < configuredConfidence;
        
        return (
          <div className={`flex items-center gap-2 ${isLow ? 'bg-red-50 p-2 rounded border-l-4 border-l-red-400' : ''}`}>
            {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
            <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(avgConfidence)}`}>
              {avgConfidence}%
            </span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  avgConfidence >= 80 ? 'bg-green-500' :
                  avgConfidence >= 60 ? 'bg-yellow-500' :
                  avgConfidence >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${avgConfidence}%` }}
              ></div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'pais',
      header: 'País',
      sortable: true,
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.country.value}</div>
          <div className="text-xs text-gray-500">{item.country.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'tipo',
      header: 'Tipo',
      sortable: true,
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.type.value}</div>
          <div className="text-xs text-gray-500">{item.type.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'uva',
      header: 'Uva',
      sortable: true,
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.grape_variety.value}</div>
          <div className="text-xs text-gray-500">{item.grape_variety.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'classificacao',
      header: 'Classificação',
      sortable: true,
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.classification.value}</div>
          <div className="text-xs text-gray-500">{item.classification.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'tamanho',
      header: 'Tamanho',
      sortable: true,
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.size.value}</div>
          <div className="text-xs text-gray-500">{item.size.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'tampa',
      header: 'Tampa',
      sortable: true,
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.closure.value}</div>
          <div className="text-xs text-gray-500">{item.closure.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'harmonizacao',
      header: 'Harmonização',
      cell: (item: WineAttributes) => (
        <div>
          <div className="text-sm">{item.pairings.values.join(', ')}</div>
          <div className="text-xs text-gray-500">{item.pairings.confidence}% conf.</div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-semibold font-inter text-dark-gray">
              Atributos de Vinhos
            </h1>
            <p className="text-sm text-gray-500">
              Upload de CSV para processamento de atributos de vinhos
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Upload Section */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium font-inter text-dark-gray mb-4">
                  Upload de CSV
                </h2>
                <FileInput
                  accept=".csv"
                  onChange={handleFileUpload}
                  isDragActive={isProcessing}
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-forest-green">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processando arquivo...</span>
                  </div>
                )}
              </div>

              {/* Actions Section - Only show download button */}
              {downloadUrl && (
                <div className="pt-4 border-t">
                  <Button
                    className="!bg-forest-green hover:!bg-green-700 !text-white font-medium"
                    onClick={() => window.location.href = downloadUrl}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Baixar CSV
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Results Table Section - Always visible when data exists */}
          {wineAttributes.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium font-inter text-dark-gray mb-4">
                  Atributos de Vinhos Processados ({wineAttributes.length} itens)
                </h2>
                
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-2 text-amber-800 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Produtos com confiança abaixo de {settings?.confidence ?? 70}% são destacados em vermelho claro
                    </span>
                  </div>
                </div>

                <DataTable
                  data={wineAttributes}
                  columns={tableColumns}
                  searchable={true}
                  onSearch={(term) => {
                    console.log('Search term:', term);
                  }}
                  rowClassName={(item: WineAttributes) => 
                    isLowConfidence(item) 
                      ? "bg-red-50 border-l-4 border-l-red-400" 
                      : ""
                  }
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
