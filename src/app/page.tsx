'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Shirt, Sparkles, Download, Palette, Wand2, Loader2, UploadCloud, Film, Play, Maximize } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/image-uploader';
import { suggestSceneDescription } from '@/ai/flows/suggest-scene-description';
import { generateSceneImage } from '@/ai/flows/generate-scene-image';
import { generateClothingImage } from '@/ai/flows/generate-clothing-image';
import { generateRedressImage } from '@/ai/flows/generate-redress-image';
import { generatePersonImage } from '@/ai/flows/generate-person-image';
import { generateVideo } from '@/ai/flows/generate-video';
import { outpaintImage } from '@/ai/flows/outpaint-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  const [redressedImage, setRedressedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [outpaintedImage, setOutpaintedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGeneratingRedress, setIsGeneratingRedress] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [isOutpainting, setIsOutpainting] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const [personText, setPersonText] = useState('');
  const [isGeneratingPerson, setIsGeneratingPerson] = useState(false);

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

  const handleGeneratePerson = async () => {
    if (!personText) {
      toast({
        variant: 'destructive',
        title: 'Missing Description',
        description: 'Please describe the person you want to generate.',
      });
      return;
    }

    setIsGeneratingPerson(true);
    setPersonImage(null);
    try {
      const result = await generatePersonImage({ description: personText });
      setPersonImage(result.imageDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Person Generation Failed',
        description: 'Could not generate the person image. Please try again.',
      });
    } finally {
      setIsGeneratingPerson(false);
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

  const handleGenerateRedress = async () => {
    if (!personImage || !clothingImage) {
      toast({
        variant: 'destructive',
        title: 'Missing Images',
        description: 'Please provide both a person and a clothing image.',
      });
      return;
    }

    setIsGeneratingRedress(true);
    setRedressedImage(null);
    setGeneratedImage(null);
    setOutpaintedImage(null);
    setGeneratedVideo(null);

    try {
      const redressResult = await generateRedressImage({
        personDataUri: personImage,
        clothingDataUri: clothingImage,
      });
      setRedressedImage(redressResult.generatedImageDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Redress Generation Failed',
        description: 'Could not generate the redressed image. Please try again.',
      });
    } finally {
      setIsGeneratingRedress(false);
    }
  };

  const handleGenerateScene = async () => {
    if (!redressedImage || !sceneDescription) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please generate a redressed image and provide a scene description.',
      });
      return;
    }

    setIsGeneratingScene(true);
    setGeneratedImage(null);
    setOutpaintedImage(null);
    setGeneratedVideo(null);

    try {
      const sceneResult = await generateSceneImage({
        personDataUri: redressedImage,
        sceneDescription,
      });
      setGeneratedImage(sceneResult.generatedImageDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Scene Generation Failed',
        description: 'Could not generate the final scene. Please try again.',
      });
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleOutpaintImage = async () => {
    if (!generatedImage) {
      toast({
        variant: 'destructive',
        title: 'Missing Image',
        description: 'Please generate the final scene image first.',
      });
      return;
    }

    setIsOutpainting(true);
    setOutpaintedImage(null);
    setGeneratedVideo(null); // Also reset video if we're changing the source image

    try {
      const result = await outpaintImage({ imageDataUri: generatedImage });
      setOutpaintedImage(result.generatedImageDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Outpainting Failed',
        description: 'Could not outpaint the image. Please try again.',
      });
    } finally {
      setIsOutpainting(false);
    }
  };

  const handleGenerateVideo = async () => {
    const imageToAnimate = outpaintedImage || generatedImage;
    if (!imageToAnimate) {
      toast({
        variant: 'destructive',
        title: 'Missing Image',
        description: 'Please generate the final scene image first.',
      });
      return;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideo(null);

    try {
      const result = await generateVideo({
        imageDataUri: imageToAnimate,
      });
      setGeneratedVideo(result.videoDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Video Generation Failed',
        description: 'Could not generate the video. Please try again.',
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };
  
  const handleDownload = (imageUrl: string | null, filename: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Palette className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">StyleScene Studio</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex flex-col gap-8 p-4 md:p-8">
        {/* STEP 1: VIRTUAL TRY-ON */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Step 1: Create Your Look</h2>
            <p className="text-muted-foreground mt-2">Start by providing an image of a person and a clothing item, either by uploading or generating with AI.</p>
          </div>
          {/* Input Cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Person Image
                </CardTitle>
                <CardDescription>
                  Upload a photo of a person, or generate one with AI.
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
                      image={personImage}
                      onImageUpload={handlePersonImageUpload}
                      onRemove={() => setPersonImage(null)}
                      title="Upload Person"
                      description="Drop a file or click to upload."
                      icon={<UploadCloud className="h-10 w-10" />}
                      data-ai-hint="person portrait"
                      className="h-full"
                    />
                  </TabsContent>
                  <TabsContent value="generate" className="flex-grow mt-4 flex flex-col gap-4">
                    <Textarea
                      placeholder="e.g., a woman with long blonde hair, wearing a black t-shirt, standing in a studio..."
                      className="resize-none"
                      value={personText}
                      onChange={(e) => setPersonText(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleGeneratePerson} disabled={isGeneratingPerson || !personText}>
                      {isGeneratingPerson ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      Generate Person
                    </Button>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted flex-grow">
                      {isGeneratingPerson && <Skeleton className="h-full w-full" />}
                      {!isGeneratingPerson && personImage && (
                        <Image
                          src={personImage}
                          alt="Uploaded or generated person"
                          fill
                          objectFit="contain"
                          className="p-2"
                        />
                      )}
                       {!isGeneratingPerson && !personImage && (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
                          <Sparkles className="h-10 w-10" />
                          <p className="text-sm">Your generated person will appear here</p>
                        </div>
                       )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
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
                          fill
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generate Redressed Image</CardTitle>
              <CardDescription>Combine the person and clothing item to see the virtual try-on result. The result will be used in the next step.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-4 items-center text-center">
                 <p className="text-muted-foreground">Once you have both images ready, click the button to generate the new look.</p>
                 <Button onClick={handleGenerateRedress} disabled={!personImage || !clothingImage || isGeneratingRedress} size="lg" className="w-full max-w-xs">
                   {isGeneratingRedress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                   Generate Look
                 </Button>
              </div>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                {isGeneratingRedress ? <Skeleton className="h-full w-full" /> : null}
                {redressedImage && (
                  <>
                    <Image
                      src={redressedImage}
                      alt="Redressed person"
                      fill
                      objectFit="cover"
                    />
                    <Button
                      onClick={() => handleDownload(redressedImage, 'redressed-image.png')}
                      size="icon"
                      className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
                      style={{
                          backgroundColor: 'hsl(var(--accent))',
                          color: 'hsl(var(--accent-foreground))'
                      }}
                      aria-label="Download Redressed Image"
                    >
                      <Download className="h-6 w-6" />
                    </Button>
                  </>
                )}
                {!isGeneratingRedress && !redressedImage && (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
                    <User className="h-12 w-12" />
                    <p className="text-sm">Virtual try-on result appears here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        <div className={cn("space-y-8", !redressedImage && "opacity-50 pointer-events-none")}>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Step 2: Set the Scene</h2>
            <p className="text-muted-foreground mt-2">Now, place your newly styled person in any scene you can imagine.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-6 w-6" />
                    Scene Description
                  </CardTitle>
                  <CardDescription>
                    Describe the final scene. Or, let AI suggest one based on your images!
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                  <Textarea
                    placeholder="e.g., walking through a neon-lit cyberpunk city at night, rain glistening on the pavement..."
                    className="min-h-[150px] resize-y"
                    value={sceneDescription}
                    onChange={(e) => setSceneDescription(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleSuggestDescription}
                    disabled={isSuggesting || !personImage || !clothingImage}
                  >
                    {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Suggest Scene
                  </Button>
              </CardContent>
              <CardFooter>
                  <Button
                    onClick={handleGenerateScene}
                    disabled={isGeneratingScene || !redressedImage || !sceneDescription}
                    className="w-full"
                    size="lg"
                    style={{
                      backgroundColor: 'hsl(var(--accent))',
                      color: 'hsl(var(--accent-foreground))'
                    }}
                  >
                    {isGeneratingScene ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Final Scene
                  </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                  <CardTitle>Final Image</CardTitle>
                  <CardDescription>Your final creation will appear here. You can then widen it or animate it.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted h-full">
                  {isGeneratingScene || isOutpainting ? <Skeleton className="h-full w-full" /> : null}
                  {(outpaintedImage || generatedImage) && !(isGeneratingScene || isOutpainting) && (
                    <>
                      <Image
                        src={outpaintedImage || generatedImage!}
                        alt="Generated scene"
                        fill
                        objectFit="cover"
                        className="transition-opacity duration-500"
                      />
                      <Button
                        onClick={() => handleDownload(outpaintedImage || generatedImage, 'final-scene.png')}
                        size="icon"
                        className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
                        style={{
                            backgroundColor: 'hsl(var(--accent))',
                            color: 'hsl(var(--accent-foreground))'
                        }}
                        aria-label="Download Final Image"
                      >
                        <Download className="h-6 w-6" />
                      </Button>
                      {generatedImage && !outpaintedImage && (
                          <Button
                              onClick={handleOutpaintImage}
                              disabled={isOutpainting}
                              className="absolute bottom-4 left-4 z-10 h-12 shadow-lg"
                              variant="outline"
                          >
                              {isOutpainting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Maximize className="mr-2 h-4 w-4" />}
                              Widen to 16:9
                          </Button>
                      )}
                    </>
                  )}
                  {!(isGeneratingScene || isOutpainting) && !generatedImage && (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
                      <Palette className="h-12 w-12" />
                      <p className="text-sm">Your final image appears here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator className="my-4" />

        <div className={cn("space-y-8", !(generatedImage || outpaintedImage) && "opacity-50 pointer-events-none")}>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Step 3: Animate Your Scene</h2>
            <p className="text-muted-foreground mt-2">Bring your creation to life by generating a short video.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-6 w-6" />
                Video Generation
              </CardTitle>
              <CardDescription>
                Generate a short video from your final scene image.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-4 items-center text-center">
                <p className="text-muted-foreground">Once your final scene is ready, click the button to create a video.</p>
                <Button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !(generatedImage || outpaintedImage)} size="lg" className="w-full max-w-xs">
                  {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Generate Video
                </Button>
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                {isGeneratingVideo ? <Skeleton className="h-full w-full" /> : null}
                {generatedVideo && (
                  <>
                    <video
                      src={generatedVideo}
                      controls
                      autoPlay
                      loop
                      muted
                      className="h-full w-full object-cover"
                    />
                    <Button
                      onClick={() => handleDownload(generatedVideo, 'generated-video.mp4')}
                      size="icon"
                      className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
                      style={{
                          backgroundColor: 'hsl(var(--accent))',
                          color: 'hsl(var(--accent-foreground))'
                      }}
                      aria-label="Download Video"
                    >
                      <Download className="h-6 w-6" />
                    </Button>
                  </>
                )}
                {!isGeneratingVideo && !generatedVideo && (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
                    <Film className="h-12 w-12" />
                    <p className="text-sm">Your generated video will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
