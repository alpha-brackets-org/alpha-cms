import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  /** Current rating value (1–5) */
  rating: number;
  /** Size variant — 'sm' for table rows, 'md' for cards/previews */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * StarRating — read-only star display component.
 * Use StarPicker (in StarPicker.tsx) when you need interactive input.
 */
export function StarRating({ rating, size = 'sm', className }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className={`flex items-center gap-0.5 ${className ?? ''}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/25'
          }`}
        />
      ))}
    </div>
  );
}
