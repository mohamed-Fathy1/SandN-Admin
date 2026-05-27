import { z } from 'zod';

export const DEFAULT_VARIANT_SIZE = 'one size';

export const variantFormSchema = z.object({
  size: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : DEFAULT_VARIANT_SIZE)),
  color: z.string().min(1, 'Pick a color'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

export const productFormSchema = z
  .object({
    name: z.object({
      en: z.string().trim().min(2, 'English name is required'),
      ar: z.string().trim().min(2, 'Arabic name is required'),
    }),
    description: z.object({
      en: z.string().trim().min(10, 'English description is required'),
      ar: z.string().trim().min(10, 'Arabic description is required'),
    }),
    price: z.number().positive('Price must be greater than 0'),
    wholesalePrice: z.number().positive('Wholesale price must be greater than 0'),
    salePrice: z.number().min(0),
    saleStartDate: z.number().int().min(0),
    saleEndDate: z.number().int().min(0),
    category: z.string().min(1, 'Pick a category'),
    subCategory: z.string().min(1, 'Pick a sub-category'),
    defaultImage: z.string().url('Upload a default image'),
    albumImages: z.array(z.string().url()).min(1, 'Add at least one album image'),
    sizeChartImage: z.string().url().optional().or(z.literal('')),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    variants: z.array(variantFormSchema).min(1, 'Add at least one variant'),
  })
  .refine((d) => d.salePrice === 0 || d.salePrice <= d.price, {
    path: ['salePrice'],
    message: 'Sale price must be ≤ regular price',
  })
  .refine((d) => d.wholesalePrice < d.price, {
    path: ['wholesalePrice'],
    message: 'Wholesale price must be < regular price',
  })
  .refine(
    (d) => d.saleEndDate === 0 || d.saleStartDate === 0 || d.saleEndDate >= d.saleStartDate,
    { path: ['saleEndDate'], message: 'Sale end must be on or after sale start' }
  );

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type VariantFormValues = z.infer<typeof variantFormSchema>;
