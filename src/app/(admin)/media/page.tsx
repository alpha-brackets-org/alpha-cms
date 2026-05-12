'use client';

import React from 'react';
import { MediaLibrary } from '@/components/cms/MediaLibrary';

export default function MediaPage() {
  return (
    <div className="min-h-full space-y-12 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold uppercase tracking-tight">
            Central Assets
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Standardized Infrastructure for Portfolio Media
          </p>
        </div>
      </div>

      <MediaLibrary multiSelect={true} />
    </div>
  );
}
