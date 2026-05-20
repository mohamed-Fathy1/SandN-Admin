import { z } from 'zod';
import { GROUP_NAMES } from '@/config/constants';

export const groupFormSchema = z.object({
  name: z.enum(GROUP_NAMES),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;
