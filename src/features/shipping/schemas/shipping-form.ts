import { z } from 'zod';

export const shippingFormSchema = z.object({
  name: z.object({
    en: z.string().trim().min(2, 'English name is required'),
    ar: z.string().trim().min(2, 'Arabic name is required'),
  }),
  cost: z
    .number({ error: 'Cost is required' })
    .int('Cost must be a whole number')
    .min(0, 'Cost cannot be negative'),
});

export type ShippingFormValues = z.infer<typeof shippingFormSchema>;
