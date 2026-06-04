import { z } from 'zod';
import { PAYMENT_METHODS } from '@/config/constants';

const optionalNote = z.string().trim().max(500, 'Note is too long').optional();
const optionalReceipt = z
  .string()
  .trim()
  .url('Invalid receipt URL')
  .optional()
  .or(z.literal(''));

/**
 * Record-payment schema. `remaining` is injected per-order so the amount can be
 * client-validated against the remaining balance (mirrors the backend rule).
 */
export function makePaymentFormSchema(remaining: number) {
  return z.object({
    amount: z
      .number({ error: 'Amount is required' })
      .positive('Amount must be greater than zero')
      .max(remaining, 'Payment amount exceeds the remaining order total'),
    method: z.enum(PAYMENT_METHODS, { error: 'Method is required' }),
    note: optionalNote,
    receiptImageUrl: optionalReceipt,
  });
}

export type PaymentFormValues = z.infer<ReturnType<typeof makePaymentFormSchema>>;

export const refundFormSchema = z.object({
  method: z.enum(PAYMENT_METHODS, { error: 'Method is required' }),
  note: optionalNote,
  receiptImageUrl: optionalReceipt,
});

export type RefundFormValues = z.infer<typeof refundFormSchema>;
