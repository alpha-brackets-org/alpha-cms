'use client';

// Media Picker Component - Integrated with Central Asset Infrastructure
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '../ui/dialog';
import { MediaLibrary } from './MediaLibrary';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Media } from '@/types/cms';

interface MediaPickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  altText?: string;
}

export function MediaPicker({
  value,
  onChange,
  label,
  altText,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (media: Media) => {
    onChange(media.imageKitUrl);
    setOpen(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </label>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="group relative aspect-video cursor-pointer rounded-xl border border-dashed border-border bg-secondary/20 transition-all hover:border-primary hover:bg-secondary/40">
            {value ? (
              <>
                <Image
                  src={value}
                  alt={altText || label || 'Selected media'}
                  fill
                  className="rounded-xl object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm">Change image</Button>
                </div>
                <button
                  onClick={clearSelection}
                  className="absolute -right-3 -top-3 z-10 rounded-full bg-destructive p-1.5 text-white shadow-sm transition-transform hover:scale-110"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="rounded-lg border border-border bg-secondary p-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  Select or upload asset
                </span>
              </div>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-7xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Media Library</DialogTitle>
          <MediaLibrary onSelect={handleSelect} allowSelection />
        </DialogContent>
      </Dialog>
    </div>
  );
}
