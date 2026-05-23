'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Save,
  Loader2,
  ArrowLeft,
  Star,
  Settings,
  ImageIcon,
  Link as LinkIcon,
  MessageSquareQuote,
} from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useToast } from '@/hooks/use-toast';
import { usePortfolios } from '@/hooks/use-portfolios';
import { MediaPicker } from '@/components/cms/MediaPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { StarRating } from '@/components/ui/StarRating';
import { StarPicker } from '@/components/ui/StarPicker';
import { Testimonial, PopulatedTestimonial, TestimonialStatus } from '@/types/cms';

interface TestimonialFormProps {
  initialData?: PopulatedTestimonial;
  onSubmit: (data: Testimonial) => void;
  isLoading: boolean;
  submitText: string;
  isNew?: boolean;
}


export function TestimonialForm({
  initialData,
  onSubmit,
  isLoading,
  submitText,
  isNew = false,
}: TestimonialFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { warning } = useToast();
  const { data: portfolios } = usePortfolios();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<Testimonial>({
    defaultValues: {
      name: '',
      role: '',
      company: '',
      avatar: '',
      content: '',
      rating: 5,
      status: TestimonialStatus.PUBLISHED,
      featured: false,
      order: 0,
      sourceUrl: '',
      platform: '',
      portfolio: '',
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (initialData) {
      const { portfolio, ...rest } = initialData;
      reset({
        ...rest,
        portfolio: portfolio ? portfolio._id ?? '' : '',
      } as unknown as Testimonial);
    }
  }, [initialData, reset]);

  const onFormSubmit = (data: Testimonial) => {
    if (!data.portfolio && !Cookies.get('alpha_active_portfolio')) {
      warning('PORTFOLIO REQUIRED', 'Please select a portfolio.');
      return;
    }
    // Inject active portfolio cookie if not explicitly chosen
    onSubmit({
      ...data,
      portfolio: data.portfolio || Cookies.get('alpha_active_portfolio') || '',
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="flex flex-1 flex-col overflow-hidden"
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-white/10 bg-background/80 p-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/testimonials"
            className="rounded-lg p-2 transition-all hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              {isNew ? 'New Testimonial' : 'Edit Testimonial'}
            </h2>
            <p className="font-mono text-[9px] lowercase text-primary">
              /testimonials/editor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Modified
            </Badge>
          )}
          <Button type="submit" disabled={isLoading} size="sm" className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isLoading ? 'SAVING...' : submitText}
          </Button>
        </div>
      </div>

      {/* Two-pane body */}
      <div className="flex min-h-0 flex-1">
        {/* ── Main Content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 p-6 md:p-8">
            {/* Client Name */}
            <div className="space-y-4">
              <input
                {...register('name', { required: true })}
                placeholder="Client Name"
                className={`w-full border-b-2 bg-transparent text-3xl font-bold transition-colors placeholder:text-muted-foreground/30 focus:outline-none md:text-4xl ${errors.name
                    ? 'border-destructive'
                    : 'border-transparent focus:border-border/50'
                  } pb-4`}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Role / Title
                  </Label>
                  <Input
                    {...register('role')}
                    placeholder="e.g. CTO, Founder"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Company
                  </Label>
                  <Input
                    {...register('company')}
                    placeholder="e.g. Acme Corp"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Testimonial Content */}
            <div className="space-y-3 rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <MessageSquareQuote className="h-5 w-5 text-primary" />
                <Label className="text-sm font-bold uppercase tracking-widest">
                  Testimonial Content
                </Label>
              </div>
              <Textarea
                {...register('content', { required: true })}
                placeholder="Write the testimonial here..."
                rows={6}
                className={`text-base leading-relaxed ${errors.content ? 'border-destructive' : ''}`}
              />
              {errors.content && (
                <p className="text-[9px] font-bold uppercase text-destructive">
                  Content is required
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="space-y-3 rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
              <Label className="block border-b border-white/10 pb-3 text-sm font-bold uppercase tracking-widest">
                Star Rating
              </Label>
              <Controller
                name="rating"
                control={control}
                render={({ field }) => (
                  <StarPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Source */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <LinkIcon className="h-4 w-4 text-primary" />
                <Label className="text-sm font-bold uppercase tracking-widest">
                  Source
                </Label>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Input
                    {...register('platform')}
                    placeholder="LinkedIn, Google, Twitter..."
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source URL</Label>
                  <Input
                    {...register('sourceUrl')}
                    placeholder="https://linkedin.com/..."
                    className="h-10 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-white/10 xl:block">
          <div className="space-y-4 p-4">
            {/* Preview Card */}
            <div className="rounded-2xl border border-white/10 bg-card/50 p-4 shadow-sm backdrop-blur-xl">
              <h3 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-[10px] font-bold uppercase tracking-widest">
                <MessageSquareQuote className="h-4 w-4 text-primary" />
                Live Preview
              </h3>
              <div className="space-y-3">
                <StarRating rating={watchedValues.rating || 5} size="md" />
                {watchedValues.content ? (
                  <p className="text-xs italic leading-relaxed text-muted-foreground">
                    &ldquo;{watchedValues.content.slice(0, 120)}
                    {watchedValues.content.length > 120 ? '...' : ''}&rdquo;
                  </p>
                ) : (
                  <p className="text-[10px] italic text-muted-foreground/40">
                    Testimonial content will appear here...
                  </p>
                )}
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-bold">
                    {watchedValues.name || 'Client Name'}
                  </p>
                  {(watchedValues.role || watchedValues.company) && (
                    <p className="text-[10px] text-muted-foreground">
                      {[watchedValues.role, watchedValues.company]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {watchedValues.platform && (
                    <p className="mt-1 text-[9px] font-bold uppercase text-primary/70">
                      via {watchedValues.platform}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/50 p-4 shadow-sm backdrop-blur-xl">
              <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 text-[10px] font-bold uppercase tracking-widest">
                <Settings className="h-4 w-4 text-primary" /> Settings
              </h3>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select {...register('status')}>
                  {Object.values(TestimonialStatus).map((s) => (
                    <option key={s} value={s} className="bg-black text-white">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>

              {isMounted && !Cookies.get('alpha_active_portfolio') && isNew && (
                <div className="space-y-2">
                  <Label>Assign to Portfolio</Label>
                  <Select {...register('portfolio')}>
                    <option value="" disabled className="bg-black text-white">
                      Select a portfolio
                    </option>
                    {portfolios?.map((p) => (
                      <option
                        key={p._id}
                        value={p._id}
                        className="bg-black text-white"
                      >
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  {errors.portfolio && (
                    <p className="text-[9px] font-bold uppercase text-destructive">
                      {errors.portfolio.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  {...register('order', { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="0"
                  className="h-10 text-xs"
                />
                <p className="text-[9px] text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-secondary/50 p-3">
                <Label className="flex cursor-pointer items-center gap-2">
                  <Star className="h-3 w-3 text-amber-400" /> Featured
                </Label>
                <Checkbox {...register('featured')} />
              </div>
            </div>

            {/* Avatar */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/50 p-4 shadow-sm backdrop-blur-xl">
              <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 text-[10px] font-bold uppercase tracking-widest">
                <ImageIcon className="h-4 w-4 text-primary" /> Client Avatar
              </h3>
              <Controller
                name="avatar"
                control={control}
                render={({ field }) => (
                  <MediaPicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    label="Profile Photo"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
