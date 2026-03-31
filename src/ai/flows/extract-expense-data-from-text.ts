'use server';

import {ai} from '@/ai/genkit';
import {TransactionCategorySchema} from '@/lib/types';
import {z} from 'genkit';

const ExtractTransactionDataInputSchema = z.object({
  text: z
    .string()
    .describe("The text extracted from the transaction record image via OCR."),
  categories: z.array(z.string()).describe("A list of valid category names for the user."),
});
export type ExtractTransactionDataInput = z.infer<typeof ExtractTransactionDataInputSchema>;

const ExtractTransactionDataOutputSchema = z.object({
  transactions: z.array(
    z.object({
      amount: z.number().describe('The total amount of the transaction.'),
      date: z.string().describe('The date of the transaction (ISO format).'),
      description: z.string().describe('A description of the transaction.'),
      type: z.enum(['income', 'expense']).describe('The type of transaction.'),
      category: TransactionCategorySchema.describe('The category of the transaction.'),
      quantityInKg: z.number().optional().describe('The quantity of the item sold, in kilograms (kg).'),
      ratePerKg: z.number().optional().describe('The rate per kilogram (kg) for the item sold.'),
    })
  ).describe('An array of extracted transactions.'),
});
export type ExtractTransactionDataOutput = z.infer<typeof ExtractTransactionDataOutputSchema>;

export async function extractExpenseData(input: ExtractTransactionDataInput): Promise<ExtractTransactionDataOutput> {
  return extractTransactionDataFlow(input);
}

const extractTransactionDataFlow = ai.defineFlow(
  {
    name: 'extractTransactionDataFlow',
    inputSchema: ExtractTransactionDataInputSchema,
    outputSchema: ExtractTransactionDataOutputSchema,
  },
  async ({ text, categories }) => {

    const prompt = ai.definePrompt({
        name: 'extractTransactionDataPrompt',
        input: {schema: ExtractTransactionDataInputSchema},
        output: {schema: ExtractTransactionDataOutputSchema},
        prompt: `You are an expert financial assistant specializing in extracting transaction information from text records for a farm.

You will receive text from a record, and your goal is to extract all transactions. The text may be in English or other languages like Tamil.

Each transaction consists of an amount, date, description, category, and type.
- The 'type' is either 'income' (money received) or 'expense' (money spent).
- The 'category' MUST be one of the following values: ${categories.join(', ')}. If no suitable category is found, default to 'Farm Maintenance'.

For income transactions, especially crop sales, please also extract the quantity (in Kg, sometimes written as KILO) and the rate (Rate/Kg).
- The fields for these are 'quantityInKg' and 'ratePerKg'.
- These fields should only be populated for income transactions where the information is available.

Respond with a JSON array of transaction objects. Each object in the array MUST have the keys "amount", "date", "description", "category", and "type". The keys "quantityInKg" and "ratePerKg" are optional.

Here is the text from the transaction record:

{{{text}}}
`,
    });

    const {output} = await prompt({ text, categories });
    return output!;
  }
);
