import { z } from 'zod';

export const groupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(50, 'Name is too long'),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;
