import { z } from 'zod';

export const colorFormSchema = z.object({
  name: z.object({
    en: z.string().trim().min(2, 'English name is required'),
    ar: z.string().trim().min(2, 'Arabic name is required'),
  }),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Hex must look like #RRGGBB')
    .transform((s) => s.toUpperCase()),
});

export type ColorFormValues = z.infer<typeof colorFormSchema>;
