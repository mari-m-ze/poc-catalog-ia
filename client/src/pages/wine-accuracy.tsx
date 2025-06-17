import { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, TrendingUp, Target, BarChart3, FileText } from 'lucide-react';

interface AccuracyReport {
  executionId: number;
  executionDate: string;
  provider: string;
  totalRecords: number;
  overallAccuracy: number;
  confidenceLevels: {
    perfect: ConfidenceLevelStats;
    high: ConfidenceLevelStats;
    medium: ConfidenceLevelStats;
    low: ConfidenceLevelStats;
  };
  fieldAccuracy: {
    country: FieldAccuracyStats;
    type: FieldAccuracyStats;
    classification: FieldAccuracyStats;
    grape_variety: FieldAccuracyStats;
    size: FieldAccuracyStats;
    closure: FieldAccuracyStats;
    pairings: FieldAccuracyStats;
  };
}

interface ConfidenceLevelStats {
  range: string;
  totalFields: number;
  matchingFields: number;
  accuracyPercentage: number;
  fieldBreakdown: Record<string, { total: number; matches: number; accuracy: number }>;
}

interface FieldAccuracyStats {
  totalComparisons: number;
  matches: number;
  accuracyPercentage: number;
  confidenceBreakdown: {
    perfect: { total: number; matches: number; accuracy: number };
    high: { total: number; matches: number; accuracy: number };
    medium: { total: number; matches: number; accuracy: number };
    low: { total: number; matches: number; accuracy: number };
  };
}

interface WineEnrichmentExecution {
  id: number;
  execution_date: string;
  provider: string;
  status: string;
}

// Dicionário de tradução dos campos
const FIELD_LABELS_PT: Record<string, string> = {
  country: 'País',
  type: 'Tipo',
  classification: 'Classificação',
  grape_variety: 'Uva',
  size: 'Tamanho',
  closure: 'Tampa',
  pairings: 'Harmonização',
};

export default function WineAccuracy() {
  const [executions, setExecutions] = useState<WineEnrichmentExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<string>('');
  const [accuracyReport, setAccuracyReport] = useState<AccuracyReport | null>(null);
  const [reportSummary, setReportSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/wines/enrichment/executions');
      if (!response.ok) throw new Error('Failed to fetch executions');
      const data = await response.json();
      // Filter to only show successful executions
      const successfulExecutions = data.filter((execution: WineEnrichmentExecution) => 
        execution.status === 'OK'
      );
      setExecutions(successfulExecutions);
    } catch (err) {
      setError('Failed to load executions');
      console.error(err);
    }
  };

  const fetchAccuracyReport = async (executionId: string) => {
    setLoading(true);
    setError('');
    try {
      const [reportResponse, summaryResponse] = await Promise.all([
        fetch(`/api/wines/enrichment/executions/${executionId}/accuracy`),
        fetch(`/api/wines/enrichment/executions/${executionId}/accuracy/summary`)
      ]);

      if (!reportResponse.ok || !summaryResponse.ok) {
        throw new Error('Failed to fetch accuracy data');
      }

      const reportData = await reportResponse.json();
      const summaryData = await summaryResponse.json();

      setAccuracyReport(reportData);
      setReportSummary(summaryData.summary);
    } catch (err) {
      setError('Failed to load accuracy report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutionChange = (value: string) => {
    setSelectedExecution(value);
    if (value) {
      fetchAccuracyReport(value);
    }
  };

  const getAccuracyBadgeVariant = (accuracy: number): "default" | "secondary" | "destructive" => {
    if (accuracy >= 90) return 'default';
    if (accuracy >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Acurácia do Enriquecimento de Vinhos</h1>
          <p className="text-muted-foreground">
            Analise a acurácia dos atributos de vinho gerados por IA em comparação com os dados originais
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Selecionar Execução
          </CardTitle>
          <CardDescription>
            Escolha uma execução de enriquecimento bem-sucedida para analisar sua acurácia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedExecution} onValueChange={handleExecutionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma execução bem-sucedida para analisar" />
            </SelectTrigger>
            <SelectContent>
              {executions.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Nenhuma execução bem-sucedida disponível para análise
                </div>
              ) : (
                executions.map((execution) => (
                  <SelectItem key={execution.id} value={execution.id.toString()}>
                    Execução #{execution.id} - {execution.provider} - {new Date(execution.execution_date).toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error === 'Failed to load executions' ? 'Falha ao carregar execuções' : 'Falha ao carregar relatório de acurácia'}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando relatório de acurácia...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {accuracyReport && !loading && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acurácia Geral</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accuracyReport.overallAccuracy}%</div>
                <Progress value={accuracyReport.overallAccuracy} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accuracyReport.totalRecords}</div>
                <p className="text-xs text-muted-foreground">Registros processados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Provedor</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{accuracyReport.provider}</div>
                <p className="text-xs text-muted-foreground">Provedor de IA</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data da Execução</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {new Date(accuracyReport.executionDate).toLocaleDateString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Data de processamento</p>
              </CardContent>
            </Card>
          </div>

          {/* Confidence Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Acurácia por Nível de Confiança</CardTitle>
              <CardDescription>
                Análise da acurácia em diferentes faixas de confiança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(accuracyReport.confidenceLevels).map(([level, stats]) => (
                  <div key={level} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{stats.range}</h4>
                      <Badge variant={getAccuracyBadgeVariant(stats.accuracyPercentage)}>
                        {stats.accuracyPercentage}%
                      </Badge>
                    </div>
                    <Progress value={stats.accuracyPercentage} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {stats.matchingFields} / {stats.totalFields} campos corretos
                    </p>
                    {level === 'perfect' && stats.accuracyPercentage < 100 && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Esperado 100% de acurácia para confiança 100%!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Accuracy */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Acurácia por Campo</CardTitle>
              <CardDescription>
                Detalhamento da acurácia por atributo do vinho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(accuracyReport.fieldAccuracy).map(([field, stats]) => (
                  <div key={field} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{FIELD_LABELS_PT[field] || field}</h4>
                      <Badge variant={getAccuracyBadgeVariant(stats.accuracyPercentage)}>
                        {stats.accuracyPercentage}%
                      </Badge>
                    </div>
                    <Progress value={stats.accuracyPercentage} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {stats.matches} / {stats.totalComparisons} comparações
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Field Accuracy by Confidence Level */}
          <Card>
            <CardHeader>
              <CardTitle>Acurácia por Campo e Nível de Confiança</CardTitle>
              <CardDescription>
                Detalhamento mostrando como cada campo se comporta em diferentes níveis de confiança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Campo</th>
                      <th className="text-center p-3 font-medium">Confiança 100%</th>
                      <th className="text-center p-3 font-medium">Confiança 90-99%</th>
                      <th className="text-center p-3 font-medium">Confiança 80-89%</th>
                      <th className="text-center p-3 font-medium">Confiança 70-79%</th>
                      <th className="text-center p-3 font-medium">Geral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(accuracyReport.fieldAccuracy).map(([field, stats]) => (
                      <tr key={field} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium capitalize">{FIELD_LABELS_PT[field] || field}</td>
                        
                        {/* 100% Confidence */}
                        <td className="p-3 text-center">
                          {stats.confidenceBreakdown.perfect.total > 0 ? (
                            <div className="space-y-1">
                              <Badge 
                                variant={stats.confidenceBreakdown.perfect.accuracy === 100 ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {stats.confidenceBreakdown.perfect.accuracy}%
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {stats.confidenceBreakdown.perfect.matches}/{stats.confidenceBreakdown.perfect.total}
                              </div>
                              {stats.confidenceBreakdown.perfect.accuracy < 100 && (
                                <div className="text-xs text-red-600 font-medium">
                                  ⚠️ Esperado 100%
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>

                        {/* 90-99% Confidence */}
                        <td className="p-3 text-center">
                          {stats.confidenceBreakdown.high.total > 0 ? (
                            <div className="space-y-1">
                              <Badge 
                                variant={getAccuracyBadgeVariant(stats.confidenceBreakdown.high.accuracy)}
                                className="text-xs"
                              >
                                {stats.confidenceBreakdown.high.accuracy}%
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {stats.confidenceBreakdown.high.matches}/{stats.confidenceBreakdown.high.total}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>

                        {/* 80-89% Confidence */}
                        <td className="p-3 text-center">
                          {stats.confidenceBreakdown.medium.total > 0 ? (
                            <div className="space-y-1">
                              <Badge 
                                variant={getAccuracyBadgeVariant(stats.confidenceBreakdown.medium.accuracy)}
                                className="text-xs"
                              >
                                {stats.confidenceBreakdown.medium.accuracy}%
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {stats.confidenceBreakdown.medium.matches}/{stats.confidenceBreakdown.medium.total}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>

                        {/* 70-79% Confidence */}
                        <td className="p-3 text-center">
                          {stats.confidenceBreakdown.low.total > 0 ? (
                            <div className="space-y-1">
                              <Badge 
                                variant={getAccuracyBadgeVariant(stats.confidenceBreakdown.low.accuracy)}
                                className="text-xs"
                              >
                                {stats.confidenceBreakdown.low.accuracy}%
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {stats.confidenceBreakdown.low.matches}/{stats.confidenceBreakdown.low.total}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>

                        {/* Overall */}
                        <td className="p-3 text-center">
                          <div className="space-y-1">
                            <Badge 
                              variant={getAccuracyBadgeVariant(stats.accuracyPercentage)}
                              className="text-xs"
                            >
                              {stats.accuracyPercentage}%
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {stats.matches}/{stats.totalComparisons}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Legend */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Legenda:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>• <strong>Confiança 100%:</strong> IA estava completamente certa</div>
                  <div>• <strong>Confiança 90-99%:</strong> IA estava altamente confiante</div>
                  <div>• <strong>Confiança 80-89%:</strong> IA estava moderadamente confiante</div>
                  <div>• <strong>Confiança 70-79%:</strong> IA estava com baixa confiança</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <strong>Insight:</strong> Quando a IA reporta confiança 100%, espera-se 100% de acurácia. 
                  Qualquer desvio indica possíveis problemas de calibração do modelo.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Report */}
          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado de Acurácia</CardTitle>
              <CardDescription>
                Análise abrangente da acurácia da IA por níveis de confiança e campos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96 text-gray-900">
                  {reportSummary}
                </pre>
              </div>
            </CardContent>
          </Card>
                 </div>
       )}
        </div>
      </main>
    </div>
   );
} 