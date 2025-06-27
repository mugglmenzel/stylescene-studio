'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Shirt, Sparkles, Download, Palette, Wand2, Loader2, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/image-uploader';
import { suggestSceneDescription } from '@/ai/flows/suggest-scene-description';
import { generateSceneImage } from '@/ai/flows/generate-scene-image';
import { generateClothingImage } from '@/ai/flows/generate-clothing-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function StyleScenePage() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [sceneDescription, setSceneDescription] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clothingText, setClothingText] = useState('');
  const [isGeneratingClothing, setIsGeneratingClothing] = useState(false);

  const { toast } = useToast();

  const handlePersonImageUpload = async (file: File) => {
    try {
      const dataUri = await fileToDataUri(file);
      setPersonImage(dataUri);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error uploading image', description: 'Could not read the person image file.' });
    }
  };

  const handleClothingImageUpload = async (file: File) => {
    try {
      const dataUri = await fileToDataUri(file);
      setClothingImage(dataUri);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error uploading image', description: 'Could not read the clothing image file.' });
    }
  };

  const handleGenerateClothing = async () => {
    if (!clothingText) {
      toast({
        variant: 'destructive',
        title: 'Missing Description',
        description: 'Please describe the clothing you want to generate.',
      });
      return;
    }

    setIsGeneratingClothing(true);
    setClothingImage(null);
    try {
      const result = await generateClothingImage({ description: clothingText });
      setClothingImage(result.imageDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Clothing Generation Failed',
        description: 'Could not generate the clothing image. Please try again.',
      });
    } finally {
      setIsGeneratingClothing(false);
    }
  };

  const handleSuggestDescription = async () => {
    if (!personImage || !clothingImage) {
      toast({
        variant: 'destructive',
        title: 'Missing Images',
        description: 'Please upload both a person and a clothing image to get a suggestion.',
      });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await suggestSceneDescription({
        personImageDataUri: personImage,
        clothingImageDataUri: clothingImage,
      });
      setSceneDescription(result.sceneDescription);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: 'Could not generate a scene description.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!personImage || !clothingImage || !sceneDescription) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please upload both images and provide a scene description.',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const result = await generateSceneImage({
        personDataUri: personImage,
        clothingDataUri: clothingImage,
        sceneDescription,
      });
      setGeneratedImage(result.generatedImageDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate the image. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'stylescene-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Palette className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">StyleScene</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:col-span-2">
            <ImageUploader
              image={personImage}
              onImageUpload={handlePersonImageUpload}
              onRemove={() => setPersonImage(null)}
              title="Person Image"
              description="Upload a photo of a person."
              icon={<User className="h-10 w-10" />}
              data-ai-hint="person portrait"
            />
            
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shirt className="h-6 w-6" />
                  Clothing Item
                </CardTitle>
                <CardDescription>
                  Upload an image of an outfit, or generate one with AI.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <Tabs defaultValue="upload" className="flex-grow flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload Image</TabsTrigger>
                    <TabsTrigger value="generate">Generate with AI</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="flex-grow mt-4">
                    <ImageUploader
                      image={clothingImage}
                      onImageUpload={handleClothingImageUpload}
                      onRemove={() => setClothingImage(null)}
                      title="Upload Clothing"
                      description="Drop a file or click to upload."
                      icon={<UploadCloud className="h-10 w-10" />}
                      data-ai-hint="clothing flatlay"
                      className="h-full"
                    />
                  </TabsContent>
                  <TabsContent value="generate" className="flex-grow mt-4 flex flex-col gap-4">
                    <Textarea
                      placeholder="e.g., a stylish red leather jacket with silver zippers..."
                      className="resize-none"
                      value={clothingText}
                      onChange={(e) => setClothingText(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleGenerateClothing} disabled={isGeneratingClothing || !clothingText}>
                      {isGeneratingClothing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      Generate Clothing
                    </Button>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted flex-grow">
                      {isGeneratingClothing && <Skeleton className="h-full w-full" />}
                      {!isGeneratingClothing && clothingImage && (
                        <Image
                          src={clothingImage}
                          alt="Uploaded or generated clothing"
                          layout="fill"
                          objectFit="contain"
                          className="p-2"
                        />
                      )}
                       {!isGeneratingClothing && !clothingImage && (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
                          <Sparkles className="h-10 w-10" />
                          <p className="text-sm">Your generated clothing will appear here</p>
                        </div>
                       )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-6 w-6" />
                  Create Your Scene
                </CardTitle>
                <CardDescription>
                  Describe the scene where you want to place the person wearing the clothes. Or, let AI suggest one for you!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., walking through a neon-lit cyberpunk city at night, rain glistening on the pavement..."
                  className="min-h-[120px] resize-y"
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleSuggestDescription}
                  disabled={isSuggesting || !personImage || !clothingImage}
                >
                  {isSuggesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Suggest Scene
                </Button>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !personImage || !clothingImage || !sceneDescription}
                  className="w-full"
                  style={{
                    backgroundColor: 'hsl(var(--accent))',
                    color: 'hsl(var(--accent-foreground))'
                  }}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Image
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
                <CardDescription>Your creation will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                  {isGenerating && <Skeleton className="h-full w-full" />}
                  {!isGenerating && generatedImage && (
                    <>
                      <Image
                        src={generatedImage}
                        alt="Generated scene"
                        layout="fill"
                        objectFit="cover"
                        className="transition-opacity duration-500 hover:opacity-90"
                      />
                      <Button
                        onClick={handleDownload}
                        size="icon"
                        className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
                        style={{
                            backgroundColor: 'hsl(var(--accent))',
                            color: 'hsl(var(--accent-foreground))'
                        }}
                        aria-label="Download Image"
                      >
                        <Download className="h-6 w-6" />
                      </Button>
                    </>
                  )}
                  {!isGenerating && !generatedImage && (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Palette className="h-12 w-12" />
                      <p>Your image awaits</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
