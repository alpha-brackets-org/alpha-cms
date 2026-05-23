'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  Save,
  ImageIcon,
  Settings,
  Tag as TagIcon,
  Loader2,
  Clock,
  Calendar,
  Star,
  Search,
  X,
  Eye,
  Building2,
  Briefcase,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/use-categories';
import { usePortfolios } from '@/hooks/use-portfolios';
import { MediaPicker } from '@/components/cms/MediaPicker';
import { SeoAnalyzer } from '@/components/cms/SeoAnalyzer';
import { CharCount } from '@/components/cms/CharCount';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseStudy, PopulatedCaseStudy, PublishStatus, Tag } from '@/types/cms';
import dynamic from 'next/dynamic';

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(
  () =>
    import('@/components/cms/RichTextEditor').then((mod) => mod.RichTextEditor),
  { ssr: false }
);

interface CaseStudyFormProps {
  initialData?: PopulatedCaseStudy;
  onSubmit: (data: CaseStudy) => void;
  isLoading: boolean;
  submitText: string;
  isNew?: boolean;
}

export function CaseStudyForm({
  initialData,
  onSubmit,
  isLoading,
  submitText,
  isNew = false,
}: CaseStudyFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { error, warning } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: categoriesResponse } = useCategories();
  const { data: portfolios } = usePortfolios();
  const categories = categoriesResponse?.data || [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm<CaseStudy>({
    defaultValues: {
      projectTitle: '',
      slug: '',
      client: '',
      industry: '',
      year: new Date().getFullYear().toString(),
      content: '',
      excerpt: '',
      status: PublishStatus.DRAFT,
      featured: false,
      portfolio: '',
      category: '',
      tags: [],
      services: [],
      readTime: '',
      coverImage: '',
      pdfUrl: '',
      seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        ogImage: '',
      },
    },
  });

  const watchedValues = watch();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tags',
  });

  useEffect(() => {
    if (initialData) {
      const { portfolio, category, ...rest } = initialData;
      reset({
        ...rest,
        portfolio: portfolio ? portfolio._id : '',
        category: category ? category._id : '',
        seo: initialData.seo || {
          metaTitle: '',
          metaDescription: '',
          keywords: '',
          ogImage: '',
        },
        tags: (initialData.tags || []) as Tag[],
        services: initialData.services || [],
        coverImage: initialData.coverImage || '',
        pdfUrl: initialData.pdfUrl || '',
        readTime: initialData.readTime || '',
      } as unknown as CaseStudy);
    }
  }, [initialData, reset]);

  const handlePreview = () => {
    if (isDirty) {
      warning('SAVE REQUIRED', 'Please save your changes before previewing.');
      return;
    }

    const values = getValues();
    const activePortfolioId =
      values.portfolio || Cookies.get('alpha_active_portfolio');
    const portfolio = portfolios?.find((p) => p._id === activePortfolioId);

    if (!portfolio?.domain) {
      error('PREVIEW UNAVAILABLE', 'No domain configured for this portfolio.');
      return;
    }

    const baseUrl = portfolio.domain.startsWith('http')
      ? portfolio.domain
      : `https://${portfolio.domain}`;
    const previewUrl = `${baseUrl}/projects/${values.slug}`;
    window.open(previewUrl, '_blank');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (
        !fields.find(
          (f) => f.tag.toLowerCase() === tagInput.trim().toLowerCase()
        )
      ) {
        append({ tag: tagInput.trim() });
      }
      setTagInput('');
    }
  };

  const handleAddService = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && serviceInput.trim()) {
      e.preventDefault();
      const currentServices = getValues('services') || [];
      if (!currentServices.includes(serviceInput.trim())) {
        reset({
          ...getValues(),
          services: [...currentServices, serviceInput.trim()],
        });
      }
      setServiceInput('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    const currentServices = getValues('services') || [];
    reset({
      ...getValues(),
      services: currentServices.filter((s) => s !== serviceToRemove),
    });
  };

  const onFormSubmit = (data: CaseStudy) => {
    onSubmit(data);
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
            href="/case-studies"
            className="rounded-lg p-2 transition-all hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              {isNew ? 'New Case Study' : 'Editing Project'}
            </h2>
            <p className="font-mono text-[9px] lowercase text-primary">
              /case-studies/editor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              System Modified
            </Badge>
          )}
          {!isNew && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="gap-2"
            >
              <Eye className="h-4 w-4" /> PREVIEW
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
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
        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 p-6 md:p-8">
            {/* Title & Slug */}
            <div className="space-y-4">
              <input
                {...register('projectTitle')}
                placeholder="Case Study Title"
                className={`w-full border-b-2 bg-transparent text-3xl font-bold transition-colors placeholder:text-muted-foreground/30 focus:outline-none md:text-4xl ${errors.projectTitle
                    ? 'border-destructive'
                    : 'border-transparent focus:border-border/50'
                  } pb-4`}
              />
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-secondary/20 p-3 font-mono text-[10px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase text-primary">Slug:</span>
                  <input
                    {...register('slug')}
                    placeholder="project-slug"
                    className="bg-transparent font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-3">
              <Label className="text-sm font-bold tracking-widest text-primary">
                Overview (Minimalistic Teaser)
              </Label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    content={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* SEO Section */}
            <div className="space-y-6 rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Search className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  SEO Infrastructure
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Meta Title</Label>
                    <Input
                      {...register('seo.metaTitle')}
                      placeholder="SEO optimized title..."
                    />
                    <CharCount
                      current={watchedValues.seo?.metaTitle?.length || 0}
                      max={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Keywords</Label>
                    <Input
                      {...register('seo.keywords')}
                      placeholder="nextjs, cms, architecture"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    {...register('seo.metaDescription')}
                    rows={5}
                    placeholder="Brief summary for search engines..."
                  />
                  <CharCount
                    current={watchedValues.seo?.metaDescription?.length || 0}
                    max={160}
                  />
                </div>
              </div>
              <div className="border-t border-white/10 pt-6">
                <Label className="mb-4 block">
                  OpenGraph Image (Social Sharing)
                </Label>
                <Controller
                  name="seo.ogImage"
                  control={control}
                  render={({ field }) => (
                    <MediaPicker
                      value={field.value}
                      onChange={field.onChange}
                      label="Social Share Image"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - independently scrollable */}
        <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-white/10 xl:block">
          <div className="space-y-4 p-4">
            <SeoAnalyzer
              title={watchedValues.seo?.metaTitle || watchedValues.projectTitle}
              description={
                watchedValues.seo?.metaDescription || watchedValues.excerpt
              }
              content={watchedValues.content}
              keywords={watchedValues.seo?.keywords}
              ogImage={watchedValues.seo?.ogImage}
            />

            {/* Case Study Details */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/50 p-4 shadow-sm backdrop-blur-xl">
              <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs font-bold uppercase tracking-widest">
                <Settings className="h-4 w-4 text-primary" /> Case Study Details
              </h3>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select {...register('status')}>
                  {Object.values(PublishStatus).map((status) => (
                    <option
                      key={status}
                      value={status}
                      className="bg-black text-white"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
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
                      {errors.portfolio?.message as string}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Category</Label>
                <Select {...register('category')}>
                  <option value="" className="bg-black text-white">
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option
                      key={cat._id}
                      value={cat._id}
                      className="bg-black text-white"
                    >
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Client
                  </Label>
                  <Input
                    {...register('client')}
                    placeholder="e.g. Acme Corp"
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Industry
                  </Label>
                  <Input
                    {...register('industry')}
                    placeholder="e.g. Technology"
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Year
                  </Label>
                  <Input
                    {...register('year')}
                    placeholder="2024"
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Read Time
                  </Label>
                  <Input
                    {...register('readTime')}
                    placeholder="e.g. 5 min read"
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-secondary/50 p-3">
                <Label className="flex cursor-pointer items-center gap-2">
                  <Star className="h-3 w-3 text-primary" /> Feature Case Study
                </Label>
                <Checkbox {...register('featured')} />
              </div>

              <div className="space-y-2">
                <Label>Short Excerpt</Label>
                <Textarea
                  {...register('excerpt')}
                  placeholder="Summarize the case study..."
                  rows={3}
                  className="min-h-[100px] text-xs"
                />
                <CharCount
                  current={watchedValues.excerpt?.length || 0}
                  max={200}
                />
              </div>
            </div>

            {/* Taxonomies */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/50 p-4 shadow-sm backdrop-blur-xl">
              <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs font-bold uppercase tracking-widest">
                <TagIcon className="h-4 w-4 text-primary" /> Taxonomies
              </h3>

              <div className="space-y-3">
                <Label>Services (e.g. AI & ML)</Label>
                <Input
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyDown={handleAddService}
                  placeholder="Add service and press Enter..."
                  className="h-10 text-[10px]"
                />
                <div className="flex flex-wrap gap-2">
                  {(getValues('services') || []).map((service, index) => (
                    <Badge
                      key={index}
                      variant="default"
                      className="gap-1 bg-primary px-2 py-1 text-primary-foreground hover:bg-primary"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service)}
                        className="ml-1 transition-colors hover:text-destructive-foreground"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <Label>Keywords / Tags</Label>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag and press Enter..."
                  className="h-10 text-[10px]"
                />
                <div className="flex flex-wrap gap-2">
                  {fields.map((field, index) => (
                    <Badge
                      key={field.id}
                      variant="secondary"
                      className="gap-1 px-2 py-1"
                    >
                      {field.tag}
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="ml-1 transition-colors hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Media & PDF */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/50 p-4 shadow-sm backdrop-blur-xl">
              <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs font-bold uppercase tracking-widest">
                <ImageIcon className="h-4 w-4 text-primary" /> Media & Content
              </h3>

              <Controller
                name="coverImage"
                control={control}
                render={({ field }) => (
                  <MediaPicker
                    value={field.value}
                    onChange={field.onChange}
                    label="Hero Cover Image"
                  />
                )}
              />

              <div className="space-y-2 border-t border-white/10 pt-4">
                <Label>Gated Content PDF (Lead Magnet)</Label>
                <Input
                  {...register('pdfUrl')}
                  placeholder="https://ik.imagekit.io/.../case-study.pdf"
                  className="h-10 font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Upload the PDF to Media library and paste URL here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
