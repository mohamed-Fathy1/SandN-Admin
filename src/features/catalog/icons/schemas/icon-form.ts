import { z } from 'zod';

export const iconKeySchema = z
  .string()
  .trim()
  .min(2, 'Key must be at least 2 characters')
  .max(40, 'Key must be at most 40 characters')
  .regex(/^[a-z0-9][a-z0-9-_]*$/i, 'Use letters, numbers, dashes or underscores')
  .transform((v) => v.toLowerCase());

export const iconSvgSchema = z
  .string()
  .trim()
  .min(10, 'Paste the full SVG markup')
  .refine((v) => /^<svg[\s>]/i.test(v.trim()), 'Must be valid SVG markup');

export const iconFormSchema = z.object({
  key: iconKeySchema,
  svg: iconSvgSchema,
  isActive: z.boolean().default(true),
});

export type IconFormValues = z.infer<typeof iconFormSchema>;

export const updateIconFormSchema = z.object({
  svg: iconSvgSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateIconFormValues = z.infer<typeof updateIconFormSchema>;
