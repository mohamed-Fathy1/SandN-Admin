import { z } from 'zod';

export const subCategoryFormSchema = z.object({
  name: z.object({
    en: z.string().trim().min(2, 'English name is required'),
    ar: z.string().trim().min(2, 'Arabic name is required'),
  }),
  groupSize: z.string().min(1, 'Pick a size group'),
  category: z.string().min(1, 'Pick a parent category'),
  imageUrl: z.string().url('Upload an image first'),
});

export type SubCategoryFormValues = z.infer<typeof subCategoryFormSchema>;
