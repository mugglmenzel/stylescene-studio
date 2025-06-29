import { config } from 'dotenv';
config();

import '@/ai/flows/generate-scene-image.ts';
import '@/ai/flows/suggest-scene-description.ts';
import '@/ai/flows/generate-clothing-image.ts';
import '@/ai/flows/generate-redress-image.ts';
import '@/ai/flows/generate-person-image.ts';
import '@/ai/flows/generate-video.ts';
