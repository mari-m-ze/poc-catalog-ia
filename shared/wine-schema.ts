import { z } from 'zod';

export const wineInputSchema = z.object({
  id: z.number(),
  nome: z.string().min(1)
});

export const generateWineAttributesSchema = z.object({
  produtos: z.union([
    wineInputSchema,
    z.array(wineInputSchema).min(1)
  ])
});

// Type inference
export type GenerateWineAttributesRequest = z.infer<typeof generateWineAttributesSchema>;
