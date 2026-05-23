'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarPickerProps {
  /** Current rating value (1–5) */
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * StarPicker — interactive star input for forms.
 * For read-only display use StarRating instead.
 */
export function StarPicker({ value, onChange, className }: StarPickerProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${i} out of 5`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${i <= (hovered || value)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30 hover:text-amber-300'
              }`}
          />
        </button>
      ))}
      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {hovered || value}/5
      </span>
    </div>
  );
}
