import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export function getGeminiClient() {
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set. If you've deployed to Netlify, make sure to add this environment variable in your site settings.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function processImageWithOcr(base64Image: string): Promise<{ text: string }> {
  const ai = getGeminiClient();
  
  // Extract MIME type and data from base64 string
  const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 image format.");
  }
  const mimeType = matches[1];
  const data = matches[2];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Extract the text from the following image. The image contains a list of items, which might be handwritten. Transcribe the text as accurately as possible." },
          { inlineData: { mimeType, data } }
        ]
      }
    ]
  });

  return { text: response.text || "" };
}

export async function extractExpenseData(text: string, categories: string[]): Promise<any> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `You are an expert financial assistant specializing in extracting transaction information from text records for a farm.

You will receive text from a record, and your goal is to extract all transactions. The text may be in English or other languages like Tamil.

Each transaction consists of an amount, date, description, category, and type.
- The 'type' is either 'income' (money received) or 'expense' (money spent).
- The 'category' MUST be one of the following values: ${categories.join(', ')}. If no suitable category is found, default to 'Farm Maintenance'.

For income transactions, especially crop sales, please also extract the quantity (in Kg, sometimes written as KILO) and the rate (Rate/Kg).
- The fields for these are 'quantityInKg' and 'ratePerKg'.
- These fields should only be populated for income transactions where the information is available.

Respond with a JSON array of transaction objects. Each object in the array MUST have the keys "amount", "date", "description", "category", and "type". The keys "quantityInKg" and "ratePerKg" are optional.

Here is the text from the transaction record:

${text}`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER, description: "The total amount of the transaction." },
                date: { type: Type.STRING, description: "The date of the transaction (ISO format)." },
                description: { type: Type.STRING, description: "A description of the transaction." },
                type: { type: Type.STRING, enum: ["income", "expense"], description: "The type of transaction." },
                category: { type: Type.STRING, description: "The category of the transaction." },
                quantityInKg: { type: Type.NUMBER, description: "The quantity of the item sold, in kilograms (kg)." },
                ratePerKg: { type: Type.NUMBER, description: "The rate per kilogram (kg) for the item sold." }
              },
              required: ["amount", "date", "description", "type", "category"]
            }
          }
        },
        required: ["transactions"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", response.text);
    throw new Error("Failed to extract structured data from text.");
  }
}
