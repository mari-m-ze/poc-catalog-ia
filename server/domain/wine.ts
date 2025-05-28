export const Countries = [
  'Argentina',
  'Australia',
  'Chile',
  'França',
  'Itália',
  'Portugal',
  'Espanha',
  'Estados Unidos',
  'África do Sul',
  'Brasil',
  'Nova Zelândia',
  'Alemanha'
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

// export const Suppliers = [
//   'Wine Co.',
//   'Global Wines',
//   'Vinhos & Cia',
//   'Euro Wines',
//   'South American Imports',
//   'Premium Wine Imports',
//   'Direct Wines'
// ] as const;

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
  Error: 'Error'
} as const;

export type ProcessingStatus = (typeof ProcessingStatus)[keyof typeof ProcessingStatus];

export type WineAttributes = {
  id: string;
  nome: string;
  pais: WineAttributeWithConfidence<Country | ''>;
  tipo: WineAttributeWithConfidence<WineType | ''>;
  classificacao: WineAttributeWithConfidence<Classification | ''>;
  uva: WineAttributeWithConfidence<GrapeVariety | ''>;
  tamanho: WineAttributeWithConfidence<Size | ''>;
  tampa: WineAttributeWithConfidence<Closure | ''>;
  harmonizacao: {
    values: WinePairing[];
    confidence: number;
  };
  status: ProcessingStatus;
};

export type WineInput = {
  id: number;
  nome: string;
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
