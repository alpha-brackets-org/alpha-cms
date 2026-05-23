'use client';

import React, { useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeoStatus, SeoFactor, SeoAnalyzerProps } from '@/types/seo';

export const SeoAnalyzer = ({
  title,
  description,
  content,
  keywords,
  ogImage,
}: SeoAnalyzerProps) => {
  const audit = useMemo(() => {
    const factors: SeoFactor[] = [];

    // 1. Title Analysis
    if (!title) {
      factors.push({
        label: 'Meta Title',
        status: SeoStatus.ERROR,
        message: "Missing title. Search engines won't know what this is about.",
      });
    } else if (title.length < 30) {
      factors.push({
        label: 'Meta Title',
        status: SeoStatus.WARNING,
        message: 'Too short. Aim for 50-60 characters for better visibility.',
      });
    } else if (title.length > 65) {
      factors.push({
        label: 'Meta Title',
        status: SeoStatus.WARNING,
        message: 'Too long. It will be truncated in search results.',
      });
    } else {
      factors.push({
        label: 'Meta Title',
        status: SeoStatus.PERFECT,
        message: 'Optimal length. Looks great on Google.',
      });
    }

    // 2. Description Analysis
    if (!description) {
      factors.push({
        label: 'Description',
        status: SeoStatus.ERROR,
        message: 'Missing meta description. Click-through rate will be low.',
      });
    } else if (description.length < 70) {
      factors.push({
        label: 'Description',
        status: SeoStatus.WARNING,
        message: 'A bit brief. Add more detail to entice readers.',
      });
    } else if (description.length > 160) {
      factors.push({
        label: 'Description',
        status: SeoStatus.WARNING,
        message: 'Over 160 characters. It will be cut off on search pages.',
      });
    } else {
      factors.push({
        label: 'Description',
        status: SeoStatus.PERFECT,
        message: 'Perfect length for snippet previews.',
      });
    }

    // 3. Content Analysis
    const wordCount =
      content
        ?.replace(/<[^>]*>/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length || 0;
    if (wordCount === 0) {
      factors.push({
        label: 'Readability',
        status: SeoStatus.ERROR,
        message: 'No content detected. The "Thin Content" penalty may apply.',
      });
    } else if (wordCount < 300) {
      factors.push({
        label: 'Readability',
        status: SeoStatus.WARNING,
        message: `Current: ${wordCount} words. Aim for 300+ for standard SEO ranking.`,
      });
    } else {
      factors.push({
        label: 'Readability',
        status: SeoStatus.PERFECT,
        message: `${wordCount} words. Substantial enough for indexing.`,
      });
    }

    // 4. Social SEO
    if (!ogImage) {
      factors.push({
        label: 'Social Presence',
        status: SeoStatus.WARNING,
        message: 'Missing Social Image. Links will look generic when shared.',
      });
    } else {
      factors.push({
        label: 'Social Presence',
        status: SeoStatus.PERFECT,
        message: 'Branded OG Image set. Ready for LinkedIn/X.',
      });
    }

    // 5. Keyword Density
    if (!keywords) {
      factors.push({
        label: 'Keywords',
        status: SeoStatus.NEUTRAL,
        message: 'No keywords defined. Harder to track ranking intent.',
      });
    }

    const score = Math.round(
      (factors.filter((f) => f.status === SeoStatus.PERFECT).length /
        factors.filter((f) => f.status !== SeoStatus.NEUTRAL).length) *
        100
    );

    return { factors, score };
  }, [title, description, content, keywords, ogImage]);

  const getStatusIcon = (status: SeoStatus) => {
    switch (status) {
      case SeoStatus.PERFECT:
        return <CheckCircle2 className="h-3 w-3 text-primary" />;
      case SeoStatus.WARNING:
        return <AlertTriangle className="h-3 w-3 text-amber-500" />;
      case SeoStatus.ERROR:
        return <XCircle className="h-3 w-3 text-destructive" />;
      default:
        return <HelpCircle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-card/50 p-4 shadow-sm backdrop-blur-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">
            SEO Live Audit
          </h3>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={cn(
              'text-xl font-black tabular-nums',
              audit.score > 80
                ? 'text-primary'
                : audit.score > 50
                  ? 'text-amber-400'
                  : 'text-destructive'
            )}
          >
            {audit.score}%
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
            Trust Score
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            audit.score > 80
              ? 'bg-primary'
              : audit.score > 50
                ? 'bg-amber-400'
                : 'bg-destructive'
          )}
          style={{ width: `${audit.score}%` }}
        />
      </div>

      {/* Factors */}
      <div className="space-y-2">
        {audit.factors.map((factor, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-white/5 bg-secondary/20 p-3 transition-all hover:border-white/15 hover:bg-secondary/30"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {factor.label}
              </span>
              {getStatusIcon(factor.status)}
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {factor.message}
            </p>
          </div>
        ))}
      </div>

      {/* Footer disclaimer */}
      <p className="mt-4 text-center text-[8px] italic text-muted-foreground/60">
        Search engine results may vary based on actual indexing latency.
      </p>
    </div>
  );
};
