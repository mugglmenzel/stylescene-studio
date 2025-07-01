'use server';

/**
 * @fileOverview Combines a person image and scene description to generate a new image using Vertex AI SDK.
 *
 * - generateSceneImage - A function that handles the image generation process.
 * - GenerateSceneImageInput - The input type for the generateSceneImage function.
 * - GenerateSceneImageOutput - The return type for the generateSceneImage function.
 */

import {z} from 'zod';
import {v1, helpers} from '@google-cloud/aiplatform';
import { EditMode, GoogleGenAI, SubjectReferenceImage, SubjectReferenceType } from '@google/genai';

// Configure the client
const {PredictionServiceClient} = v1;
const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};
const predictionServiceClient = new PredictionServiceClient(clientOptions);

const GenerateSceneImageInputSchema = z.object({
  personDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  sceneDescription: z.string().describe('The description of the scene.'),
});
export type GenerateSceneImageInput = z.infer<typeof GenerateSceneImageInputSchema>;

const GenerateSceneImageOutputSchema = z.object({
  generatedImageDataUri: z
    .string()
    .describe(
      "The generated image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type GenerateSceneImageOutput = z.infer<
  typeof GenerateSceneImageOutputSchema
>;

export async function generateSceneImage(
  input: GenerateSceneImageInput
): Promise<GenerateSceneImageOutput> {
  // Use the client to automatically discover the project ID
  const projectId = process.env.GCP_PROJECT || await predictionServiceClient.getProjectId();
  const location = 'us-central1';

  const ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location,
  });

  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-capability-001`;

  const personImageMimeType = input.personDataUri.split(';')[0].split(':')[1];
  const personImageBase64 = input.personDataUri.split(',')[1];

  const instance = {
    prompt: `Generate a photorealistic image of the person [1] from the reference image in this scene: "${input.sceneDescription}". The final image should be a coherent and high-quality photograph.`,
    referenceImages: [{
      referenceType: "REFERENCE_TYPE_SUBJECT",
      referenceId: 1,
      referenceImage: {
        bytesBase64Encoded: personImageBase64,
        mimeType: personImageMimeType,
      },
      subjectImageConfig: {
        subjectDescription: "the person",
        subjectType: "SUBJECT_TYPE_PERSON"
      }
    }],
  };

  const instances = [helpers.toValue(instance)];

  const parameters = helpers.toValue({
    sampleCount: 1,
  });

  const request = {
    endpoint,
    instances,
    parameters,
  };

  try {
    const referenceImage = new SubjectReferenceImage();
    referenceImage.referenceId = 1;
    referenceImage.referenceImage = {
      imageBytes: personImageBase64,
      mimeType: personImageMimeType,
    };
    referenceImage.config = {
      subjectDescription: 'the person',
      subjectType: SubjectReferenceType.SUBJECT_TYPE_PERSON,
    };

    const response = await ai.models.editImage({
      model: 'imagen-3.0-capability-001',
      prompt: `Generate a photorealistic image of the person [1] from the reference image in this scene: "${input.sceneDescription}". The final image should be a coherent and high-quality photograph.`,
      referenceImages: [referenceImage],
      config: {
        aspectRatio: '16:9',
        editMode: EditMode.EDIT_MODE_DEFAULT
      }
    });
    
    const images = response.generatedImages;
    if (images === undefined || images.length === 0) {
      throw new Error('No images generated');
    }

    const generatedImageDataUri = `data:${images[0].image!.mimeType!};base64,${images[0].image!.imageBytes!}`;

    return {generatedImageDataUri};
  } catch (error) {
    console.error('Vertex AI Prediction Error:', error);
    throw new Error('Failed to generate image with Vertex AI.');
  }
}
