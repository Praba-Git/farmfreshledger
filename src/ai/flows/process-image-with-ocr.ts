'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessImageInputSchema = z.object({
  image: z
    .string()
    .describe(
      "An image of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProcessImageInput = z.infer<typeof ProcessImageInputSchema>;

const ProcessImageOutputSchema = z.object({
  text: z.string().describe('The text extracted from the image.'),
});
export type ProcessImageOutput = z.infer<typeof ProcessImageOutputSchema>;

export async function processImageWithOcr(input: ProcessImageInput): Promise<ProcessImageOutput> {
  return processImageFlow(input);
}

const ocrPrompt = ai.definePrompt({
  name: 'ocrPrompt',
  input: { schema: ProcessImageInputSchema },
  output: { schema: ProcessImageOutputSchema },
  prompt: `Extract the text from the following image. The image contains a list of items, which might be handwritten. Transcribe the text as accurately as possible.

Image: {{media url=image}}`,
  model: 'googleai/gemini-2.5-flash',
});

const processImageFlow = ai.defineFlow(
  {
    name: 'processImageFlow',
    inputSchema: ProcessImageInputSchema,
    outputSchema: ProcessImageOutputSchema,
  },
  async input => {
    const { output } = await ocrPrompt(input);
    return output!;
  }
);
