'use server';

/**
 * @fileOverview Generates a video from an image using a Vertex AI model.
 *
 * - generateVideo - A function that handles the video generation.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import {z} from 'zod';
import {v1, helpers} from '@google-cloud/aiplatform';
import { GoogleGenAI } from '@google/genai';

// Configure the client
const {PredictionServiceClient} = v1;
const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};
const predictionServiceClient = new PredictionServiceClient(clientOptions);

const GenerateVideoInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "The generated video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:video/mp4;base64,<encoded_data>'"
    ),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const projectId = process.env.GCP_PROJECT || await predictionServiceClient.getProjectId();
  const location = 'us-central1';

  const ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location,
  });

  const imageMimeType = input.imageDataUri.split(';')[0].split(':')[1];
  const imageBase64 = input.imageDataUri.split(',')[1];

  try {
    let operation = await ai.models.generateVideos(
      {
        model: 'veo-2.0-generate-001',
        prompt: "Animate this image with subtle motion.",
        image: {
          imageBytes: imageBase64,
          mimeType: imageMimeType,
        },
        config: {
          numberOfVideos: 1,
          durationSeconds: 8,
          enhancePrompt: true,
        }
      }
    );
    while (!operation.done) {
      console.log('Waiting for completion');
      await delay(1000);
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const response = operation.response;
    const videos = response?.generatedVideos;
    if (videos === undefined || videos.length === 0) {
      throw new Error('No videos generated');
    }

    const videoDataUri = `data:${videos[0].video!.mimeType!};base64,${videos[0].video!.videoBytes!}`;

    return {videoDataUri};
  } catch (error) {
    console.error('Vertex AI Video Prediction Error:', error);
    throw new Error('Failed to generate video with Vertex AI.');
  }
}
