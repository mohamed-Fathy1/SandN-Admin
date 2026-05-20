import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.object({
    en: z.string().trim().min(2, 'English name is required'),
    ar: z.string().trim().min(2, 'Arabic name is required'),
  }),
  groupSize: z.string().min(1, 'Pick a size group'),
  imageUrl: z.string().url('Upload an image first'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
