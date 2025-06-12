import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Loader2, RefreshCw, Eye, Calendar, User, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { DataTable } from '../components/ui/data-table';

// Types based on the database schema
type WineEnrichmentExecution = {
  id: number;
  execution_date: string;
  provider: string;
  status: string;
};

type WineEnrichmentRecord = {
  id: number;
  id_execution: number;
  product_id: number | null;
  product_title: string;
  country: string | null;
  country_confidence: number | null;
  type: string | null;
  type_confidence: number | null;
  classification: string | null;
  classification_confidence: number | null;
  grape_variety: string | null;
  grape_variety_confidence: number | null;
  size: string | null;
  size_confidence: number | null;
  closure: string | null;
  closure_confidence: number | null;
  pairings: string | null;
  pairings_confidence: number | null;
  provider: string;
  status: string;
  error: string | null;
};

type ExecutionWithRecords = {
  execution: WineEnrichmentExecution;
  records: WineEnrichmentRecord[];
};

export function WineEnrichmentPage() {
  const { toast } = useToast();
  const [executions, setExecutions] = useState<WineEnrichmentExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionWithRecords | null>(null);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchExecutions = async () => {
    setIsLoadingExecutions(true);
    try {
      const response = await fetch('/api/wines/enrichment/executions');
      if (!response.ok) {
        throw new Error('Failed to fetch executions');
      }
      const data = await response.json();
      setExecutions(data);
    } catch (error) {
      console.error('Error fetching executions:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico de execuções',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingExecutions(false);
    }
  };

  const fetchExecutionDetails = async (executionId: number) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/wines/enrichment/executions/${executionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch execution details');
      }
      const data = await response.json();
      setSelectedExecution(data);
    } catch (error) {
      console.error('Error fetching execution details:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar detalhes da execução',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OK':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OK':
        return 'bg-green-100 text-green-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAverageConfidence = (record: WineEnrichmentRecord): number => {
    const confidences = [
      record.country_confidence,
      record.type_confidence,
      record.classification_confidence,
      record.grape_variety_confidence,
      record.size_confidence,
      record.closure_confidence,
      record.pairings_confidence
    ].filter(conf => conf !== null) as number[];
    
    if (confidences.length === 0) return 0;
    return Math.round(confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length);
  };

  const executionColumns = [
    {
      id: 'id',
      header: 'ID',
      sortable: true,
      cell: (item: WineEnrichmentExecution) => (
        <div className="font-medium">{item.id}</div>
      ),
    },
    {
      id: 'execution_date',
      header: 'Data de Execução',
      sortable: true,
      cell: (item: WineEnrichmentExecution) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{new Date(item.execution_date).toLocaleString('pt-BR')}</span>
        </div>
      ),
    },
    {
      id: 'provider',
      header: 'Provedor IA',
      sortable: true,
      cell: (item: WineEnrichmentExecution) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="capitalize">{item.provider}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (item: WineEnrichmentExecution) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(item.status)}
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (item: WineEnrichmentExecution) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchExecutionDetails(item.id)}
          disabled={isLoadingDetails}
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver Detalhes
        </Button>
      ),
    },
  ];

  const recordColumns = [
    {
      id: 'product_id',
      header: 'ID Produto',
      sortable: true,
      cell: (item: WineEnrichmentRecord) => (
        <div className="font-medium">{item.product_id || '-'}</div>
      ),
    },
    {
      id: 'product_title',
      header: 'Nome do Produto',
      sortable: true,
      cell: (item: WineEnrichmentRecord) => (
        <div className="max-w-xs truncate">{item.product_title}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (item: WineEnrichmentRecord) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(item.status)}
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>
      ),
    },
    {
      id: 'confidence',
      header: 'Confiança Média',
      sortable: true,
      cell: (item: WineEnrichmentRecord) => {
        const avgConfidence = calculateAverageConfidence(item);
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              avgConfidence >= 80 ? 'bg-green-100 text-green-800' :
              avgConfidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
              avgConfidence >= 40 ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {avgConfidence}%
            </span>
          </div>
        );
      },
    },
    {
      id: 'country',
      header: 'País',
      cell: (item: WineEnrichmentRecord) => (
        <div>
          <div>{item.country || '-'}</div>
          {item.country_confidence && (
            <div className="text-xs text-gray-500">{item.country_confidence}% conf.</div>
          )}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Tipo',
      cell: (item: WineEnrichmentRecord) => (
        <div>
          <div>{item.type || '-'}</div>
          {item.type_confidence && (
            <div className="text-xs text-gray-500">{item.type_confidence}% conf.</div>
          )}
        </div>
      ),
    },
    {
      id: 'classification',
      header: 'Classificação',
      cell: (item: WineEnrichmentRecord) => (
        <div>
          <div>{item.classification || '-'}</div>
          {item.classification_confidence && (
            <div className="text-xs text-gray-500">{item.classification_confidence}% conf.</div>
          )}
        </div>
      ),
    },
    {
      id: 'grape_variety',
      header: 'Uva',
      cell: (item: WineEnrichmentRecord) => (
        <div>
          <div>{item.grape_variety || '-'}</div>
          {item.grape_variety_confidence && (
            <div className="text-xs text-gray-500">{item.grape_variety_confidence}% conf.</div>
          )}
        </div>
      ),
    },
    {
      id: 'size',
      header: 'Tamanho',
      cell: (item: WineEnrichmentRecord) => (
        <div>
          <div>{item.size || '-'}</div>
          {item.size_confidence && (
            <div className="text-xs text-gray-500">{item.size_confidence}% conf.</div>
          )}
        </div>
      ),
    },
    {
      id: 'closure',
      header: 'Tampa',
      cell: (item: WineEnrichmentRecord) => (
        <div>
          <div>{item.closure || '-'}</div>
          {item.closure_confidence && (
            <div className="text-xs text-gray-500">{item.closure_confidence}% conf.</div>
          )}
        </div>
      ),
    },
    {
      id: 'pairings',
      header: 'Harmonização',
      cell: (item: WineEnrichmentRecord) => (
        <div>
          <div className="text-sm">{item.pairings || '-'}</div>
          {item.pairings_confidence && (
            <div className="text-xs text-gray-500">{item.pairings_confidence}% conf.</div>
          )}
        </div>
      ),
    },
    {
      id: 'error',
      header: 'Erro',
      cell: (item: WineEnrichmentRecord) => (
        <div>
          {item.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border max-w-xs">
              {item.error}
            </div>
          )}
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold font-inter text-dark-gray">
                  Histórico de Enriquecimento
                </h1>
                <p className="text-sm text-gray-500">
                  Visualização de execuções e registros de enriquecimento de vinhos
                </p>
              </div>
              <Button
                onClick={fetchExecutions}
                disabled={isLoadingExecutions}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingExecutions ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Executions Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium font-inter text-dark-gray mb-4">
                Execuções ({executions.length} registros)
              </h2>
              
              {isLoadingExecutions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Carregando execuções...</span>
                </div>
              ) : (
                <DataTable
                  data={executions}
                  columns={executionColumns}
                  searchable={true}
                  onSearch={(term) => {
                    console.log('Search term:', term);
                  }}
                />
              )}
            </div>
          </div>

          {/* Execution Details */}
          {selectedExecution && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium font-inter text-dark-gray">
                    Detalhes da Execução #{selectedExecution.execution.id}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedExecution.execution.execution_date).toLocaleString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedExecution.execution.provider}
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedExecution.execution.status)}
                      {selectedExecution.execution.status}
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-blue-800 text-sm">
                    <strong>Total de registros:</strong> {selectedExecution.records.length} | 
                    <strong> Sucessos:</strong> {selectedExecution.records.filter(r => r.status === 'OK').length} | 
                    <strong> Erros:</strong> {selectedExecution.records.filter(r => r.status === 'ERROR').length}
                  </div>
                </div>
                
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">Carregando detalhes...</span>
                  </div>
                ) : (
                  <DataTable
                    data={selectedExecution.records}
                    columns={recordColumns}
                    searchable={true}
                    onSearch={(term) => {
                      console.log('Search term:', term);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 