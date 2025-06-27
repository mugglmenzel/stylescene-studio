'use server';

/**
 * @fileOverview Provides scene description suggestions based on uploaded images of a person and clothing.
 *
 * - suggestSceneDescription - A function that takes images of a person and clothing, and returns a suggested scene description.
 * - SuggestSceneDescriptionInput - The input type for the suggestSceneDescription function.
 * - SuggestSceneDescriptionOutput - The return type for the suggestSceneDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSceneDescriptionInputSchema = z.object({
  personImageDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  clothingImageDataUri: z
    .string()
    .describe(
      "A photo of clothing, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestSceneDescriptionInput = z.infer<typeof SuggestSceneDescriptionInputSchema>;

const SuggestSceneDescriptionOutputSchema = z.object({
  sceneDescription: z.string().describe('A suggested scene description.'),
});
export type SuggestSceneDescriptionOutput = z.infer<typeof SuggestSceneDescriptionOutputSchema>;

export async function suggestSceneDescription(
  input: SuggestSceneDescriptionInput
): Promise<SuggestSceneDescriptionOutput> {
  return suggestSceneDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSceneDescriptionPrompt',
  input: {schema: SuggestSceneDescriptionInputSchema},
  output: {schema: SuggestSceneDescriptionOutputSchema},
  prompt: `You are a creative assistant helping users generate images of people wearing specific clothing in various scenes.

  Based on the provided images of a person and clothing, suggest a scene description that would be suitable for generating a photorealistic image.

  Person Image: {{media url=personImageDataUri}}
  Clothing Image: {{media url=clothingImageDataUri}}

  Consider the style and type of clothing when suggesting the scene. Keep the scene description concise and evocative.

  Output only the scene description. Do not include any other text or formatting.
  `,
});

const suggestSceneDescriptionFlow = ai.defineFlow(
  {
    name: 'suggestSceneDescriptionFlow',
    inputSchema: SuggestSceneDescriptionInputSchema,
    outputSchema: SuggestSceneDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
