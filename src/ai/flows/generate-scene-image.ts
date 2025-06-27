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
    // Step 1: Use a text model to describe the person and clothing from the images.
    const { text: description } = await ai.generate({
      model: 'vertexai/gemini-1.5-flash-preview-0514',
      prompt: [
        { text: `You are an expert fashion stylist. Look at the person in the first image and the clothing in the second.
        Create a detailed, photorealistic description of the person wearing the specified clothing.
        Describe the person's appearance (e.g., gender, hair color, style) and the clothing's details (e.g., type, color, fabric, fit).
        This description will be used by an AI image generator.
        Person Image:` },
        { media: { url: input.personDataUri } },
        { text: `Clothing Image:` },
        { media: { url: input.clothingDataUri } },
      ],
    });

    if (!description) {
        throw new Error('Could not generate a description from the images.');
    }

    // Step 2: Use the generated description to create the final image with an image generation model.
    const finalPrompt = `A photorealistic image of a person, described as: "${description}". The person is in the following scene: "${input.sceneDescription}". The overall image should be coherent and natural-looking.`;

    const { media } = await ai.generate({
      model: 'vertexai/imagegeneration@006',
      prompt: finalPrompt,
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
