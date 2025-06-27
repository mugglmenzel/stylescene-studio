'use client';

import { UploadCloud, Trash2 } from 'lucide-react';
import React, { useState, useRef } from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  image: string | null;
  onImageUpload: (file: File) => void;
  onRemove: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

export function ImageUploader({ image, onImageUpload, onRemove, title, description, icon, className, ...props }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerInputClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center transition-all duration-300 relative aspect-square flex flex-col items-center justify-center shadow-inner',
        isDragging ? 'border-primary bg-primary/10' : 'bg-muted/30',
        !image && 'cursor-pointer hover:border-primary/80 hover:bg-primary/5',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={!image ? triggerInputClick : undefined}
      {...props}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {image ? (
        <>
          <Image src={image} alt={title} layout="fill" objectFit="contain" className="rounded-md p-2" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-primary">{icon}</div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm">{description}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <UploadCloud className="h-4 w-4" />
            <span>Drag & drop or click to upload</span>
          </div>
        </div>
      )}
    </div>
  );
}
