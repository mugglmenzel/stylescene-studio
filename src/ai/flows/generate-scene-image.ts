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

const generateSceneImagePrompt = ai.definePrompt({
  name: 'generateSceneImagePrompt',
  input: {schema: GenerateSceneImageInputSchema},
  output: {schema: GenerateSceneImageOutputSchema},
  prompt: `Given the person in the first image, the clothing in the second image, and the following scene description, generate a photorealistic image of the person wearing the clothing in the described scene.

Person Image: {{media url=personDataUri}}
Clothing Image: {{media url=clothingDataUri}}
Scene Description: {{{sceneDescription}}}`,
});

const generateSceneImageFlow = ai.defineFlow(
  {
    name: 'generateSceneImageFlow',
    inputSchema: GenerateSceneImageInputSchema,
    outputSchema: GenerateSceneImageOutputSchema,
  },
  async input => {
    // Generate the image using Gemini 2.0 Flash experimental image generation
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: input.personDataUri}},
        {media: {url: input.clothingDataUri}},
        {text: `wearing the clothes shown, in this scene: ${input.sceneDescription}`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      throw new Error('No image was generated.');
    }

    return {generatedImageDataUri: media.url};
  }
);
