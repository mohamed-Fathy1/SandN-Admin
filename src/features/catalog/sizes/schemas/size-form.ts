import { z } from 'zod';

export const sizeFormSchema = z.object({
  groupSize: z.string().min(1, 'Pick a group'),
  size: z.string().trim().min(1, 'Size is required').max(12, 'Size too long'),
  order: z.number().int().min(0, 'Order must be ≥ 0'),
});

export type SizeFormValues = z.infer<typeof sizeFormSchema>;
