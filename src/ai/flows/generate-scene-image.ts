'use server';

/**
 * @fileOverview Combines a person image, clothing image, and scene description to generate a new image.
 *
 * - generateSceneImage - A function that handles the image generation process.
 * - GenerateSceneImageInput - The input type for the generateSceneImage function.
 * - GenerateSceneImageOutput - The return type for the generateSceneImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSceneImageInputSchema = z.object({
  personDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  clothingDataUri: z
    .string()
    .describe(
      "A photo of clothing, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  sceneDescription: z.string().describe('The description of the scene.'),
});
export type GenerateSceneImageInput = z.infer<typeof GenerateSceneImageInputSchema>;

const GenerateSceneImageOutputSchema = z.object({
  generatedImageDataUri: z
    .string()
    .describe("The generated image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateSceneImageOutput = z.infer<typeof GenerateSceneImageOutputSchema>;

export async function generateSceneImage(input: GenerateSceneImageInput): Promise<GenerateSceneImageOutput> {
  return generateSceneImageFlow(input);
}

const generateSceneImageFlow = ai.defineFlow(
  {
    name: 'generateSceneImageFlow',
    inputSchema: GenerateSceneImageInputSchema,
    outputSchema: GenerateSceneImageOutputSchema,
  },
  async input => {
    const prompt = [
        { text: `Using the following images as reference, generate a new photorealistic image.
The person from the first image should be wearing the clothing from the second image.
Place the person in the following scene: "${input.sceneDescription}".
The final image should be a coherent and high-quality photograph.
Person reference:` },
        { media: { url: input.personDataUri } },
        { text: `Clothing reference:` },
        { media: { url: input.clothingDataUri } },
    ]

    const { media } = await ai.generate({
      model: 'vertexai/imagen-3.0-generate-002',
      prompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media) {
      throw new Error('No image was generated.');
    }

    return { generatedImageDataUri: media.url };
  }
);
