import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.email('Invalid email address'),
});

export const confirmPaymentSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const deductCreditSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const addCreditsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
});

export type CreateCheckoutSessionDto = z.infer<typeof createCheckoutSessionSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
export type DeductCreditDto = z.infer<typeof deductCreditSchema>;
export type AddCreditsDto = z.infer<typeof addCreditsSchema>;
