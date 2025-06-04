import React, { useState } from 'react';
import { Sidebar } from '../components/sidebar';
import { FileInput } from '../components/ui/file-input';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Download, FileDown, Loader2, Eye } from 'lucide-react';
import { DataTable } from '../components/ui/data-table';

// Wine attributes type based on the server structure
type WineAttributes = {
  id: string;
  nome: string;
  status: string;
  pais: { value: string; confidence: number };
  tipo: { value: string; confidence: number };
  classificacao: { value: string; confidence: number };
  uva: { value: string; confidence: number };
  tamanho: { value: string; confidence: number };
  tampa: { value: string; confidence: number };
  harmonizacao: { values: string[]; confidence: number };
};

export function WineAttributesPage() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [wineAttributes, setWineAttributes] = useState<WineAttributes[]>([]);
  const [showTable, setShowTable] = useState(false);

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
    setShowTable(false);

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
      item.pais.confidence,
      item.tipo.confidence,
      item.classificacao.confidence,
      item.uva.confidence,
      item.tamanho.confidence,
      item.tampa.confidence,
      item.harmonizacao.confidence
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

  const tableColumns = [
    {
      id: 'nome',
      header: 'Nome do Vinho',
      cell: (item: WineAttributes) => (
        <div className="font-medium">{item.nome}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
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
      cell: (item: WineAttributes) => {
        const avgConfidence = calculateAverageConfidence(item);
        return (
          <div className="flex items-center gap-2">
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
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.pais.value}</div>
          <div className="text-xs text-gray-500">{item.pais.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'tipo',
      header: 'Tipo',
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.tipo.value}</div>
          <div className="text-xs text-gray-500">{item.tipo.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'uva',
      header: 'Uva',
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.uva.value}</div>
          <div className="text-xs text-gray-500">{item.uva.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'classificacao',
      header: 'Classificação',
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.classificacao.value}</div>
          <div className="text-xs text-gray-500">{item.classificacao.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'tamanho',
      header: 'Tamanho',
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.tamanho.value}</div>
          <div className="text-xs text-gray-500">{item.tamanho.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'tampa',
      header: 'Tampa',
      cell: (item: WineAttributes) => (
        <div>
          <div>{item.tampa.value}</div>
          <div className="text-xs text-gray-500">{item.tampa.confidence}% conf.</div>
        </div>
      ),
    },
    {
      id: 'harmonizacao',
      header: 'Harmonização',
      cell: (item: WineAttributes) => (
        <div>
          <div className="text-sm">{item.harmonizacao.values.join(', ')}</div>
          <div className="text-xs text-gray-500">{item.harmonizacao.confidence}% conf.</div>
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

              {/* Actions Section */}
              {(downloadUrl || wineAttributes.length > 0) && (
                <div className="pt-4 border-t flex gap-4">
                  {downloadUrl && (
                    <Button
                      className="!bg-forest-green hover:!bg-green-700 !text-white font-medium"
                      onClick={() => window.location.href = downloadUrl}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Baixar CSV
                    </Button>
                  )}
                  {wineAttributes.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowTable(!showTable)}
                      className="font-medium"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {showTable ? 'Ocultar' : 'Visualizar'} Tabela
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results Table Section */}
          {showTable && wineAttributes.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium font-inter text-dark-gray mb-4">
                  Atributos de Vinhos Processados ({wineAttributes.length} itens)
                </h2>
                <DataTable
                  data={wineAttributes}
                  columns={tableColumns}
                  searchable={true}
                  onSearch={(term) => {
                    // Optional: implement search functionality
                    console.log('Search term:', term);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
