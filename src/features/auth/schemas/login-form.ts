import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});
export type EmailFormValues = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  email: z.string().email(),
  activeCode: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});
export type OtpFormValues = z.infer<typeof otpSchema>;
