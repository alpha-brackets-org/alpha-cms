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
}

export function MediaPicker({ value, onChange, label }: MediaPickerProps) {
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
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="group relative aspect-video cursor-pointer border-4 border-dashed border-border bg-secondary/20 transition-all hover:border-primary hover:bg-secondary/40">
            {value ? (
              <>
                <Image
                  src={value}
                  alt="Selected"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="brutal" size="sm">
                    CHANGE IMAGE
                  </Button>
                </div>
                <button
                  onClick={clearSelection}
                  className="absolute -right-3 -top-3 z-10 bg-destructive p-1.5 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-110"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="border-2 border-border bg-secondary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group-hover:shadow-[4px_4px_0px_0px_rgba(var(--primary),0.2)]">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                  Select or Upload Asset
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
