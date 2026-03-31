import { z } from 'zod';

export const TransactionCategorySchema = z.string();

export const TransactionSchema = z.object({
  id: z.string().optional(),
  amount: z.number(),
  date: z.any(), // Firestore Timestamp or Date
  description: z.string(),
  type: z.enum(['income', 'expense']),
  category: TransactionCategorySchema,
  quantityInKg: z.number().optional().nullable(),
  ratePerKg: z.number().optional().nullable(),
  uid: z.string().optional(),
  createdAt: z.any().optional(), // Firestore Timestamp
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
