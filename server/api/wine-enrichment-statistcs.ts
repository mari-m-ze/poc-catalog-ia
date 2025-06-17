import { db } from "../db";
import { wine_enrichment, wine_enrichment_execution, products } from "../../shared/schema-catalog-wine";
import { eq, and } from "drizzle-orm";

export interface AccuracyReport {
  executionId: number;
  executionDate: Date;
  provider: string;
  totalRecords: number;
  overallAccuracy: number;
  confidenceLevels: {
    perfect: ConfidenceLevelStats; // 100%
    high: ConfidenceLevelStats;    // 70-99%
    medium: ConfidenceLevelStats;  // 50-69%
    low: ConfidenceLevelStats;     // <50%
  };
  fieldAccuracy: {
    country: FieldAccuracyStats;
    type: FieldAccuracyStats;
    classification: FieldAccuracyStats;
    grape_variety: FieldAccuracyStats;
    size: FieldAccuracyStats;
    closure: FieldAccuracyStats;
    // pairings: FieldAccuracyStats;
  };
}

export interface ConfidenceLevelStats {
  range: string;
  totalFields: number;
  matchingFields: number;
  accuracyPercentage: number;
  fieldBreakdown: Record<string, { total: number; matches: number; accuracy: number }>;
}

export interface FieldAccuracyStats {
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

function normalizeValue(value: string | null): string {
  if (!value) return '';
  return value.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function normalizeArrayValue(value: string | null): string[] {
  if (!value) return [];
  return value.split(/[;,]/)
    .map(v => normalizeValue(v))
    .filter(v => v.length > 0)
    .sort();
}

function getConfidenceLevel(confidence: number | null): 'perfect' | 'high' | 'medium' | 'low' {
  if (!confidence || confidence < 70) return 'low';
  if (confidence === 100) return 'perfect';
  if (confidence >= 90) return 'high';
  if (confidence >= 80) return 'medium';
  return 'low';
}

function compareValues(aiValue: string | null, originalValue: string | null, isArray: boolean = false): boolean {
  if (isArray) {
    const aiArray = normalizeArrayValue(aiValue);
    const originalArray = normalizeArrayValue(originalValue);
    
    if (aiArray.length === 0 && originalArray.length === 0) return true;
    if (aiArray.length !== originalArray.length) return false;
    
    return aiArray.every((val, index) => val === originalArray[index]);
  }
  
  return normalizeValue(aiValue) === normalizeValue(originalValue);
}

export async function analyzeExecutionAccuracy(executionId: number): Promise<AccuracyReport> {
  // Get execution details
  const execution = await db
    .select()
    .from(wine_enrichment_execution)
    .where(eq(wine_enrichment_execution.id, executionId))
    .limit(1);

  if (execution.length === 0) {
    throw new Error(`Execution with ID ${executionId} not found`);
  }

  // Check if execution was successful
  if (execution[0].status === 'ERROR') {
    throw new Error(`Cannot analyze accuracy for failed execution ${executionId}. Only successful executions can be analyzed.`);
  }

  // Get enrichment records with matching products
  const enrichmentRecords = await db
    .select({
      // Enrichment fields
      enrichment_id: wine_enrichment.id,
      product_id: wine_enrichment.product_id,
      product_title: wine_enrichment.product_title,
      ai_country: wine_enrichment.country,
      ai_country_confidence: wine_enrichment.country_confidence,
      ai_type: wine_enrichment.type,
      ai_type_confidence: wine_enrichment.type_confidence,
      ai_classification: wine_enrichment.classification,
      ai_classification_confidence: wine_enrichment.classification_confidence,
      ai_grape_variety: wine_enrichment.grape_variety,
      ai_grape_variety_confidence: wine_enrichment.grape_variety_confidence,
      ai_size: wine_enrichment.size,
      ai_size_confidence: wine_enrichment.size_confidence,
      ai_closure: wine_enrichment.closure,
      ai_closure_confidence: wine_enrichment.closure_confidence,
      ai_pairings: wine_enrichment.pairings,
      ai_pairings_confidence: wine_enrichment.pairings_confidence,
      status: wine_enrichment.status,
             // Original product fields
       original_country: products.country,
       original_type: products.type,
       original_classification: products.classification,
       original_grape_variety: products.grape_variety,
       original_size: products.size,
       original_closure: products.closure,
       original_pairings: products.pairings,
    })
        .from(wine_enrichment)
    .leftJoin(products, and(
      eq(wine_enrichment.product_id, products.id),
      eq(wine_enrichment.product_title, products.title)
    ))
    .where(and(
      eq(wine_enrichment.id_execution, executionId),
      eq(wine_enrichment.status, 'OK')
    ));

  // Initialize statistics
  const stats = {
    perfect: { range: '100%', totalFields: 0, matchingFields: 0, accuracyPercentage: 0, fieldBreakdown: {} as Record<string, any> },
    high: { range: '90-99%', totalFields: 0, matchingFields: 0, accuracyPercentage: 0, fieldBreakdown: {} as Record<string, any> },
    medium: { range: '80-89%', totalFields: 0, matchingFields: 0, accuracyPercentage: 0, fieldBreakdown: {} as Record<string, any> },
    low: { range: '70-79%', totalFields: 0, matchingFields: 0, accuracyPercentage: 0, fieldBreakdown: {} as Record<string, any> }
  };

  const fieldStats = {
    country: { totalComparisons: 0, matches: 0, accuracyPercentage: 0, confidenceBreakdown: { perfect: { total: 0, matches: 0, accuracy: 0 }, high: { total: 0, matches: 0, accuracy: 0 }, medium: { total: 0, matches: 0, accuracy: 0 }, low: { total: 0, matches: 0, accuracy: 0 } } },
    type: { totalComparisons: 0, matches: 0, accuracyPercentage: 0, confidenceBreakdown: { perfect: { total: 0, matches: 0, accuracy: 0 }, high: { total: 0, matches: 0, accuracy: 0 }, medium: { total: 0, matches: 0, accuracy: 0 }, low: { total: 0, matches: 0, accuracy: 0 } } },
    classification: { totalComparisons: 0, matches: 0, accuracyPercentage: 0, confidenceBreakdown: { perfect: { total: 0, matches: 0, accuracy: 0 }, high: { total: 0, matches: 0, accuracy: 0 }, medium: { total: 0, matches: 0, accuracy: 0 }, low: { total: 0, matches: 0, accuracy: 0 } } },
    grape_variety: { totalComparisons: 0, matches: 0, accuracyPercentage: 0, confidenceBreakdown: { perfect: { total: 0, matches: 0, accuracy: 0 }, high: { total: 0, matches: 0, accuracy: 0 }, medium: { total: 0, matches: 0, accuracy: 0 }, low: { total: 0, matches: 0, accuracy: 0 } } },
    size: { totalComparisons: 0, matches: 0, accuracyPercentage: 0, confidenceBreakdown: { perfect: { total: 0, matches: 0, accuracy: 0 }, high: { total: 0, matches: 0, accuracy: 0 }, medium: { total: 0, matches: 0, accuracy: 0 }, low: { total: 0, matches: 0, accuracy: 0 } } },
    closure: { totalComparisons: 0, matches: 0, accuracyPercentage: 0, confidenceBreakdown: { perfect: { total: 0, matches: 0, accuracy: 0 }, high: { total: 0, matches: 0, accuracy: 0 }, medium: { total: 0, matches: 0, accuracy: 0 }, low: { total: 0, matches: 0, accuracy: 0 } } },
    // pairings: { totalComparisons: 0, matches: 0, accuracyPercentage: 0, confidenceBreakdown: { perfect: { total: 0, matches: 0, accuracy: 0 }, high: { total: 0, matches: 0, accuracy: 0 }, medium: { total: 0, matches: 0, accuracy: 0 }, low: { total: 0, matches: 0, accuracy: 0 } } }
  };

  // Initialize field breakdown for confidence levels
  const fieldNames = ['country', 'type', 'classification', 'grape_variety', 'size', 'closure' /*, 'pairings' */];
  fieldNames.forEach(field => {
    ['perfect', 'high', 'medium', 'low'].forEach(level => {
      stats[level as keyof typeof stats].fieldBreakdown[field] = { total: 0, matches: 0, accuracy: 0 };
    });
  });

  let totalComparisons = 0;
  let totalMatches = 0;

  // Analyze each record (all records are already filtered to status = 'OK')
  for (const record of enrichmentRecords) {

    // Define field comparisons
    const fieldComparisons = [
      { name: 'country', aiValue: record.ai_country, originalValue: record.original_country, confidence: record.ai_country_confidence, isArray: false },
      { name: 'type', aiValue: record.ai_type, originalValue: record.original_type, confidence: record.ai_type_confidence, isArray: false },
      { name: 'classification', aiValue: record.ai_classification, originalValue: record.original_classification, confidence: record.ai_classification_confidence, isArray: false },
      { name: 'grape_variety', aiValue: record.ai_grape_variety, originalValue: record.original_grape_variety, confidence: record.ai_grape_variety_confidence, isArray: false },
      { name: 'size', aiValue: record.ai_size, originalValue: record.original_size, confidence: record.ai_size_confidence, isArray: false },
      { name: 'closure', aiValue: record.ai_closure, originalValue: record.original_closure, confidence: record.ai_closure_confidence, isArray: false },
      // { name: 'pairings', aiValue: record.ai_pairings, originalValue: record.original_pairings, confidence: record.ai_pairings_confidence, isArray: true }
    ];

    for (const field of fieldComparisons) {
      // Skip if original value is missing (can't compare)
      if (!field.originalValue) continue;

      const confidenceLevel = getConfidenceLevel(field.confidence);
      const isMatch = compareValues(field.aiValue, field.originalValue, field.isArray);

      // Update confidence level stats
      stats[confidenceLevel].totalFields++;
      stats[confidenceLevel].fieldBreakdown[field.name].total++;
      
      if (isMatch) {
        stats[confidenceLevel].matchingFields++;
        stats[confidenceLevel].fieldBreakdown[field.name].matches++;
      }

      // Update field stats
      fieldStats[field.name as keyof typeof fieldStats].totalComparisons++;
      fieldStats[field.name as keyof typeof fieldStats].confidenceBreakdown[confidenceLevel].total++;
      
      if (isMatch) {
        fieldStats[field.name as keyof typeof fieldStats].matches++;
        fieldStats[field.name as keyof typeof fieldStats].confidenceBreakdown[confidenceLevel].matches++;
      }

      totalComparisons++;
      if (isMatch) totalMatches++;
    }
  }

  // Calculate percentages
  Object.keys(stats).forEach(level => {
    const levelStats = stats[level as keyof typeof stats];
    levelStats.accuracyPercentage = levelStats.totalFields > 0 ? 
      Math.round((levelStats.matchingFields / levelStats.totalFields) * 100) : 0;
    
    // Calculate field breakdown percentages
    Object.keys(levelStats.fieldBreakdown).forEach(field => {
      const fieldBreakdown = levelStats.fieldBreakdown[field];
      fieldBreakdown.accuracy = fieldBreakdown.total > 0 ? 
        Math.round((fieldBreakdown.matches / fieldBreakdown.total) * 100) : 0;
    });
  });

  Object.keys(fieldStats).forEach(field => {
    const fieldStat = fieldStats[field as keyof typeof fieldStats];
    fieldStat.accuracyPercentage = fieldStat.totalComparisons > 0 ? 
      Math.round((fieldStat.matches / fieldStat.totalComparisons) * 100) : 0;
    
    // Calculate confidence breakdown percentages
    Object.keys(fieldStat.confidenceBreakdown).forEach(level => {
      const breakdown = fieldStat.confidenceBreakdown[level as keyof typeof fieldStat.confidenceBreakdown];
      breakdown.accuracy = breakdown.total > 0 ? 
        Math.round((breakdown.matches / breakdown.total) * 100) : 0;
    });
  });

  const overallAccuracy = totalComparisons > 0 ? Math.round((totalMatches / totalComparisons) * 100) : 0;

  return {
    executionId,
    executionDate: execution[0].execution_date || new Date(),
    provider: execution[0].provider || 'unknown',
    totalRecords: enrichmentRecords.length, // Only successful records (status = 'OK')
    overallAccuracy,
    confidenceLevels: stats,
    fieldAccuracy: fieldStats
  };
}

export async function generateAccuracyReportSummary(executionId: number): Promise<string> {
  const report = await analyzeExecutionAccuracy(executionId);
  
  let summary = `# Relatório de Acurácia - Execução ${executionId}\n\n`;
  summary += `**Provider:** ${report.provider}\n`;
  summary += `**Data:** ${report.executionDate.toLocaleDateString('pt-BR')}\n`;
  summary += `**Status:** Execução bem-sucedida (apenas execuções com sucesso são analisadas)\n`;
  summary += `**Total de Registros:** ${report.totalRecords}\n`;
  summary += `**Acurácia Geral:** ${report.overallAccuracy}%\n\n`;
  
  summary += `## Análise por Nível de Confiança\n\n`;
  
  // Perfect confidence (100%)
  const perfect = report.confidenceLevels.perfect;
  summary += `### 🎯 Confiança 100% (${perfect.totalFields} campos)\n`;
  summary += `**Acurácia:** ${perfect.accuracyPercentage}%\n`;
  if (perfect.accuracyPercentage < 100) {
    summary += `⚠️ **Atenção:** Com confiança 100%, esperava-se 100% de acurácia!\n`;
  }
  summary += `**Detalhes por campo:**\n`;
  Object.entries(perfect.fieldBreakdown).forEach(([field, stats]) => {
    if (stats.total > 0) {
      summary += `- ${field}: ${stats.accuracy}% (${stats.matches}/${stats.total})\n`;
    }
  });
  summary += `\n`;
  
  // High confidence (90-99%)
  const high = report.confidenceLevels.high;
  summary += `### 🔥 Confiança Alta 90-99% (${high.totalFields} campos)\n`;
  summary += `**Acurácia:** ${high.accuracyPercentage}%\n`;
  summary += `**Detalhes por campo:**\n`;
  Object.entries(high.fieldBreakdown).forEach(([field, stats]) => {
    if (stats.total > 0) {
      summary += `- ${field}: ${stats.accuracy}% (${stats.matches}/${stats.total})\n`;
    }
  });
  summary += `\n`;
  
  // Medium confidence (80-89%)
  const medium = report.confidenceLevels.medium;
  summary += `### 🟡 Confiança Média 80-89% (${medium.totalFields} campos)\n`;
  summary += `**Acurácia:** ${medium.accuracyPercentage}%\n`;
  summary += `**Detalhes por campo:**\n`;
  Object.entries(medium.fieldBreakdown).forEach(([field, stats]) => {
    if (stats.total > 0) {
      summary += `- ${field}: ${stats.accuracy}% (${stats.matches}/${stats.total})\n`;
    }
  });
  summary += `\n`;
  
  // Low confidence (70-79%)
  const low = report.confidenceLevels.low;
  summary += `### 🔴 Confiança Baixa 70-79% (${low.totalFields} campos)\n`;
  summary += `**Acurácia:** ${low.accuracyPercentage}%\n`;
  summary += `**Detalhes por campo:**\n`;
  Object.entries(low.fieldBreakdown).forEach(([field, stats]) => {
    if (stats.total > 0) {
      summary += `- ${field}: ${stats.accuracy}% (${stats.matches}/${stats.total})\n`;
    }
  });
  summary += `\n`;
  
  summary += `## Análise por Campo\n\n`;
  Object.entries(report.fieldAccuracy).forEach(([field, stats]) => {
    if (stats.totalComparisons > 0) {
      summary += `### ${field.toUpperCase()}\n`;
      summary += `**Acurácia Geral:** ${stats.accuracyPercentage}% (${stats.matches}/${stats.totalComparisons})\n`;
      summary += `**Por nível de confiança:**\n`;
      summary += `- 100%: ${stats.confidenceBreakdown.perfect.accuracy}% (${stats.confidenceBreakdown.perfect.matches}/${stats.confidenceBreakdown.perfect.total})\n`;
      summary += `- 90-99%: ${stats.confidenceBreakdown.high.accuracy}% (${stats.confidenceBreakdown.high.matches}/${stats.confidenceBreakdown.high.total})\n`;
      summary += `- 80-89%: ${stats.confidenceBreakdown.medium.accuracy}% (${stats.confidenceBreakdown.medium.matches}/${stats.confidenceBreakdown.medium.total})\n`;
      summary += `- 70-79%: ${stats.confidenceBreakdown.low.accuracy}% (${stats.confidenceBreakdown.low.matches}/${stats.confidenceBreakdown.low.total})\n\n`;
    }
  });
  
  return summary;
}
