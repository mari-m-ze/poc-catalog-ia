import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Loader2, RefreshCw, BarChart3, PieChart, TrendingUp, Target } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Types for the comparison data
type AttributeStats = {
  total_with_original: number;
  matches: number;
  ai_filled: number;
  original_filled: number;
};

type ComparisonStats = {
  total_comparisons: number;
  country: AttributeStats;
  type: AttributeStats;
  classification: AttributeStats;
  grape_variety: AttributeStats;
  size: AttributeStats;
  closure: AttributeStats;
  pairings: AttributeStats;
};

type ComparisonData = {
  statistics: ComparisonStats;
  sample_data: any[];
};

export function WineComparisonPage() {
  const { toast } = useToast();
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComparisonData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/wines/enrichment/comparison');
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }
      const data = await response.json();
      setComparisonData(data);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de comparação',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const getAccuracyData = () => {
    if (!comparisonData) return [];
    
    const stats = comparisonData.statistics;
    return [
      {
        attribute: 'País',
        accuracy: stats.country.total_with_original > 0 ? 
          Math.round((stats.country.matches / stats.country.total_with_original) * 100) : 0,
        total: stats.country.total_with_original
      },
      {
        attribute: 'Tipo',
        accuracy: stats.type.total_with_original > 0 ? 
          Math.round((stats.type.matches / stats.type.total_with_original) * 100) : 0,
        total: stats.type.total_with_original
      },
      {
        attribute: 'Classificação',
        accuracy: stats.classification.total_with_original > 0 ? 
          Math.round((stats.classification.matches / stats.classification.total_with_original) * 100) : 0,
        total: stats.classification.total_with_original
      },
      {
        attribute: 'Uva',
        accuracy: stats.grape_variety.total_with_original > 0 ? 
          Math.round((stats.grape_variety.matches / stats.grape_variety.total_with_original) * 100) : 0,
        total: stats.grape_variety.total_with_original
      },
      {
        attribute: 'Tamanho',
        accuracy: stats.size.total_with_original > 0 ? 
          Math.round((stats.size.matches / stats.size.total_with_original) * 100) : 0,
        total: stats.size.total_with_original
      },
      {
        attribute: 'Tampa',
        accuracy: stats.closure.total_with_original > 0 ? 
          Math.round((stats.closure.matches / stats.closure.total_with_original) * 100) : 0,
        total: stats.closure.total_with_original
      },
      {
        attribute: 'Harmonização',
        accuracy: stats.pairings.total_with_original > 0 ? 
          Math.round((stats.pairings.matches / stats.pairings.total_with_original) * 100) : 0,
        total: stats.pairings.total_with_original
      }
    ];
  };

  const getCoverageData = () => {
    if (!comparisonData) return [];
    
    const stats = comparisonData.statistics;
    const total = stats.total_comparisons;
    
    return [
      {
        attribute: 'País',
        ai_coverage: Math.round((stats.country.ai_filled / total) * 100),
        original_coverage: Math.round((stats.country.original_filled / total) * 100)
      },
      {
        attribute: 'Tipo',
        ai_coverage: Math.round((stats.type.ai_filled / total) * 100),
        original_coverage: Math.round((stats.type.original_filled / total) * 100)
      },
      {
        attribute: 'Classificação',
        ai_coverage: Math.round((stats.classification.ai_filled / total) * 100),
        original_coverage: Math.round((stats.classification.original_filled / total) * 100)
      },
      {
        attribute: 'Uva',
        ai_coverage: Math.round((stats.grape_variety.ai_filled / total) * 100),
        original_coverage: Math.round((stats.grape_variety.original_filled / total) * 100)
      },
      {
        attribute: 'Tamanho',
        ai_coverage: Math.round((stats.size.ai_filled / total) * 100),
        original_coverage: Math.round((stats.size.original_filled / total) * 100)
      },
      {
        attribute: 'Tampa',
        ai_coverage: Math.round((stats.closure.ai_filled / total) * 100),
        original_coverage: Math.round((stats.closure.original_filled / total) * 100)
      },
      {
        attribute: 'Harmonização',
        ai_coverage: Math.round((stats.pairings.ai_filled / total) * 100),
        original_coverage: Math.round((stats.pairings.original_filled / total) * 100)
      }
    ];
  };

  const getOverallStats = () => {
    if (!comparisonData) return { totalProcessed: 0, averageAccuracy: 0, totalMatches: 0 };
    
    const stats = comparisonData.statistics;
    const attributes = ['country', 'type', 'classification', 'grape_variety', 'size', 'closure', 'pairings'];
    
    let totalMatches = 0;
    let totalComparisons = 0;
    
    attributes.forEach(attr => {
      const attrStats = stats[attr as keyof ComparisonStats] as AttributeStats;
      totalMatches += attrStats.matches;
      totalComparisons += attrStats.total_with_original;
    });
    
    return {
      totalProcessed: stats.total_comparisons,
      averageAccuracy: totalComparisons > 0 ? Math.round((totalMatches / totalComparisons) * 100) : 0,
      totalMatches,
      totalComparisons
    };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

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
                  Comparação de Atributos
                </h1>
                <p className="text-sm text-gray-500">
                  Comparação entre atributos gerados por IA e dados originais dos produtos
                </p>
              </div>
              <Button
                onClick={fetchComparisonData}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Carregando dados de comparação...</span>
            </div>
          ) : comparisonData ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Processado</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getOverallStats().totalProcessed}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Target className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Precisão Média</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getOverallStats().averageAccuracy}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total de Matches</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getOverallStats().totalMatches}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <PieChart className="w-8 h-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Comparações</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getOverallStats().totalComparisons}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accuracy Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Precisão por Atributo (%)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getAccuracyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="attribute" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'Precisão']}
                      labelFormatter={(label) => `Atributo: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="accuracy" fill="#8884d8" name="Precisão (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Coverage Comparison Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Cobertura: IA vs Dados Originais (%)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getCoverageData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="attribute" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name]}
                    />
                    <Legend />
                    <Bar dataKey="ai_coverage" fill="#82ca9d" name="Cobertura IA" />
                    <Bar dataKey="original_coverage" fill="#8884d8" name="Dados Originais" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Table */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Resumo Detalhado por Atributo
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Atributo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preenchido pela IA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dados Originais
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Comparações Possíveis
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Matches
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precisão
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getAccuracyData().map((item, index) => {
                          const attrKey = ['country', 'type', 'classification', 'grape_variety', 'size', 'closure', 'pairings'][index];
                          const stats = comparisonData.statistics[attrKey as keyof ComparisonStats] as AttributeStats;
                          
                          return (
                            <tr key={item.attribute}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.attribute}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {stats.ai_filled}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {stats.original_filled}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {stats.total_with_original}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {stats.matches}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.accuracy >= 80 ? 'bg-green-100 text-green-800' :
                                  item.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {item.accuracy}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum dado de comparação disponível</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 