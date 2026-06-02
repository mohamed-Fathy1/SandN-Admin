import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.object({
    en: z.string().trim().min(2, 'English name is required'),
    ar: z.string().trim().min(2, 'Arabic name is required'),
  }),
  groupSize: z.string().min(1, 'Pick a size group'),
  iconId: z.string().min(1, 'Pick an icon'),
  imageUrl: z.string().url('Upload an image first'),
  order: z.number().int().min(0, 'Order must be ≥ 0'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
