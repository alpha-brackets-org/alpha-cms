'use client';

import React from 'react';
import { MediaLibrary } from '@/components/cms/MediaLibrary';

export default function MediaPage() {
  return (
    <div className="min-h-full space-y-12 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-semibold tracking-tight">
            Media Library
          </h2>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Manage shared assets across portfolios
          </p>
        </div>
      </div>

      <MediaLibrary multiSelect={true} />
    </div>
  );
}
