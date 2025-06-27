'use server';

/**
 * @fileOverview Generates an image of a clothing item from a text description.
 *
 * - generateClothingImage - A function that handles the clothing image generation.
 * - GenerateClothingImageInput - The input type for the generateClothingImage function.
 * - GenerateClothingImageOutput - The return type for the generateClothingImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateClothingImageInputSchema = z.object({
  description: z.string().describe('A text description of the clothing item.'),
});
export type GenerateClothingImageInput = z.infer<typeof GenerateClothingImageInputSchema>;

const GenerateClothingImageOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The generated clothing image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateClothingImageOutput = z.infer<typeof GenerateClothingImageOutputSchema>;

export async function generateClothingImage(
  input: GenerateClothingImageInput
): Promise<GenerateClothingImageOutput> {
  return generateClothingImageFlow(input);
}

const generateClothingImageFlow = ai.defineFlow(
  {
    name: 'generateClothingImageFlow',
    inputSchema: GenerateClothingImageInputSchema,
    outputSchema: GenerateClothingImageOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'vertexai/imagen-3.0-generate-002',
      prompt: `Generate a photorealistic image of this clothing item on a plain white background, suitable for a product catalog. The item should be the main focus. ${input.description}`,
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media) {
      throw new Error('No image was generated for the clothing description.');
    }

    return {imageDataUri: media.url};
  }
);
