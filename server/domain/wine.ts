export const Countries = [
  'Argentina',
  'Chile',
  'Itália',
  'Espanha',
  'França',
  'Portugal',
  'Brasil',
  'Uruguai',
  'Outros'
] as const;

export const WineTypes = [
  'Tinto',
  'Branco',
  'Rosé',
  'Espumante',
  'Sidra',
  'Outros'
] as const;

export const Classifications = [
  'Seco',
  'Suave',
  'Demi-Sec',
  'Brut'
] as const;


export const GrapeVarieties = [
  'Cabernet Sauvignon',
  'Merlot',
  'Pinot Noir',
  'Syrah',
  'Malbec',
  'Carmeneré',
  'Tannat',
  'Zinfandel',
  'Chardonnay',
  'Sauvignon Blanc',
  'Riesling',
  'Moscato',
  'Blend',
  'Outras'
] as const;

export const Sizes = [
  '750ml',
  '1L',
  '375ml',
  'Outros'
] as const;

export const Closures = [
  'Rolha',
  'Rosca',
  'Outra'
] as const;

export const WinePairings = [
  'Pizzas e Massas de Molho Vermelho',
  'Carnes vermelhas',
  'Queijos',
  'Saladas e aperitivos',
  'Carnes brancas',
  'Frutos do mar',
  'Carnes de caça',
  'Risoto e Massas de Molho Branco',
  'Pratos apimentados',
  'Sobremesas'
] as const;

// Type definitions using the const assertions
export type Country = typeof Countries[number];
export type WineType = typeof WineTypes[number];
export type Classification = typeof Classifications[number];
// export type Supplier = typeof Suppliers[number];
export type GrapeVariety = typeof GrapeVarieties[number];
export type Size = typeof Sizes[number];
export type Closure = typeof Closures[number];
export type WinePairing = typeof WinePairings[number];

// Export all enums in a single object for easier imports
export type WineAttributeWithConfidence<T> = {
  value: T;
  confidence: number; // 0 to 100
};

export const ProcessingStatus = {
  OK: 'OK',
  Error: 'Error',
  Pending: 'Pending'
} as const;

export type ProcessingStatus = (typeof ProcessingStatus)[keyof typeof ProcessingStatus];

export type WineAttributes = {
  id: string;
  title: string;
  country: WineAttributeWithConfidence<Country | ''>;
  type: WineAttributeWithConfidence<WineType | ''>;
  classification: WineAttributeWithConfidence<Classification | ''>;
  grape_variety: WineAttributeWithConfidence<GrapeVariety | ''>;
  size: WineAttributeWithConfidence<Size | ''>;
  closure: WineAttributeWithConfidence<Closure | ''>;
  pairings: {
    values: WinePairing[];
    confidence: number;
  };
  status: ProcessingStatus;
  confidence: number|null;
  error?: string | null;
};

export type WineInput = {
  id: number;
  title: string;
};

export const WineEnums = {
  Countries,
  WineTypes,
  Classifications,
  GrapeVarieties,
  Sizes,
  Closures,
  WinePairings
} as const;


export function calculateOverallConfidence(attributes: WineAttributes): number {
  const confidences = [
    attributes.country.confidence,
    attributes.type.confidence,
    attributes.classification.confidence,
    attributes.grape_variety.confidence,
    attributes.size.confidence,
    attributes.closure.confidence,
    attributes.pairings.confidence
  ];
  
  const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  return Math.round(average);
}
