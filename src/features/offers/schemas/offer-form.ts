import { z } from 'zod';
import { OFFER_TYPES } from '@/config/constants';

export const offerFormSchema = z
  .object({
    type: z.enum(OFFER_TYPES, { error: 'Type is required' }),
    isActive: z.boolean(),
    image: z.string().trim().url('Upload an image'),
    description: z.object({
      en: z.string().trim().min(2, 'English description is required'),
      ar: z.string().trim().min(2, 'Arabic description is required'),
    }),
    minOrderAmount: z
      .number({ error: 'Min order amount is required' })
      .int('Whole numbers only')
      .min(0, 'Cannot be negative'),
    discountAmount: z
      .number({ error: 'Discount is required' })
      .int('Whole numbers only')
      .min(0, 'Cannot be negative')
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'fixed_discount') {
      if (val.discountAmount == null || val.discountAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountAmount'],
          message: 'Discount must be greater than zero',
        });
      }
    }
  });

export type OfferFormValues = z.infer<typeof offerFormSchema>;
