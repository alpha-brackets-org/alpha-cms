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
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { MediaPicker } from '@/components/cms/MediaPicker';
import { useCategories } from '@/hooks/use-categories';
import { usePortfolios } from '@/hooks/use-portfolios';
import { SeoAnalyzer } from '@/components/cms/SeoAnalyzer';
import { CharCount } from '@/components/cms/CharCount';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Blog, PopulatedBlog, PublishStatus, Tag } from '@/types/cms';

interface BlogFormProps {
  initialData?: PopulatedBlog;
  onSubmit: (data: Blog) => void;
  isLoading: boolean;
  submitText: string;
  isNew?: boolean;
}

export function BlogForm({ initialData, onSubmit, isLoading, submitText, isNew = false }: BlogFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: categoriesResponse } = useCategories();
  const { data: portfolios } = usePortfolios();
  const { error, warning } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm<Blog>({
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      status: PublishStatus.DRAFT,
      featured: false,
      readTime: '',
      publishedAt: new Date().toISOString().split('T')[0],
      tags: [],
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
        publishedAt: initialData.publishedAt
          ? new Date(initialData.publishedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        seo: initialData.seo || {
          metaTitle: '',
          metaDescription: '',
          keywords: '',
          ogImage: '',
        },
        tags: (initialData.tags || []) as Tag[],
      });
    }
  }, [initialData, reset]);

  const handlePreview = () => {
    if (isDirty) {
      warning(
        'SAVE REQUIRED',
        'Please save your changes before previewing the live version.'
      );
      return;
    }

    const values = getValues();
    const activePortfolioId =
      values.portfolio || Cookies.get('alpha_active_portfolio');
    const portfolio = portfolios?.find((p) => p._id === activePortfolioId);

    if (!portfolio?.domain) {
      error(
        'PREVIEW UNAVAILABLE',
        'No live domain configured for this portfolio.'
      );
      return;
    }

    const baseUrl = portfolio.domain.startsWith('http')
      ? portfolio.domain
      : `https://${portfolio.domain}`;
    const previewUrl = `${baseUrl}/blogs/${values.slug}`;
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

  const onFormSubmit = (data: Blog) => {
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="flex min-h-full flex-col"
    >
      {/* Top Bar Actions */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b-2 border-border bg-secondary/80 p-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/blogs"
            className="border-2 border-transparent p-2 transition-all hover:border-border hover:bg-background"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              {isNew ? 'Creating New Article' : 'Editing Article'}
            </h2>
            <p className="font-mono text-[9px] lowercase text-primary">
              /blogs/editor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              System Modified
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            size="sm"
            className="gap-2"
          >
            <Eye className="h-4 w-4" /> PREVIEW
          </Button>
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

      {/* Content Area */}
      <div className="flex-1 space-y-8 p-6 md:p-8">
        {Object.keys(errors).length > 0 && (
          <div className="mb-8 flex items-center gap-3 border-2 border-destructive bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Validation Alert: Missing Required Protocol
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Main Content Area */}
          <div className="space-y-12 lg:col-span-3">
            <div className="space-y-4">
              <div className="space-y-1">
                <input
                  {...register('title')}
                  placeholder="Article Title"
                  className={`w-full border-b-2 bg-transparent text-3xl font-bold transition-colors placeholder:text-muted-foreground/30 focus:outline-none md:text-4xl ${
                    errors.title
                      ? 'border-destructive'
                      : 'border-transparent focus:border-border/50'
                  } pb-4`}
                />
              </div>

              <div className="flex items-center gap-2 border-2 border-border/30 bg-secondary/20 p-3 font-mono text-[10px] text-muted-foreground">
                <span className="font-bold text-primary">PERMALINK:</span>
                <span>/blogs/</span>
                <input
                  {...register('slug')}
                  placeholder="url-slug-here"
                  className="flex-1 bg-transparent font-bold focus:text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
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

            {/* SEO ENGINE SECTION */}
            <div className="space-y-8 border-2 border-l-8 border-border border-l-primary bg-card p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 border-b-2 border-border pb-4">
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
                    <Label>Focus Keywords</Label>
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
            </div>
          </div>

          {/* Sidebar Settings Area */}
          <div className="space-y-6">
            <SeoAnalyzer
              title={watchedValues.seo?.metaTitle || watchedValues.title}
              description={
                watchedValues.seo?.metaDescription || watchedValues.excerpt
              }
              content={watchedValues.content}
              keywords={watchedValues.seo?.keywords}
              ogImage={watchedValues.seo?.ogImage}
            />

            <div className="space-y-6 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <Settings className="h-4 w-4 text-primary" /> Parameters
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

              <div className="space-y-2">
                <Label>Category</Label>
                <Select {...register('category')}>
                  <option value="" className="bg-black text-white">
                    Select a category
                  </option>
                  {categoriesResponse?.data.map((cat) => (
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Read Time
                  </Label>
                  <Input
                    {...register('readTime')}
                    placeholder="5 min"
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Publish Date
                  </Label>
                  <Input
                    type="date"
                    {...register('publishedAt')}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-2 border-border bg-secondary/50 p-4">
                <Label className="flex cursor-pointer items-center gap-2">
                  <Star className="h-3 w-3 text-primary" /> Featured Post
                </Label>
                <Checkbox {...register('featured')} />
              </div>

              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea
                  {...register('excerpt')}
                  placeholder="Summary for social media..."
                  rows={3}
                  className="min-h-[100px] text-xs"
                />
                <CharCount
                  current={watchedValues.excerpt?.length || 0}
                  max={200}
                />
              </div>
            </div>

            <div className="space-y-4 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <ImageIcon className="h-4 w-4 text-primary" /> Social Media
              </h3>
              <Controller
                name="seo.ogImage"
                control={control}
                render={({ field }) => (
                  <MediaPicker
                    value={field.value}
                    onChange={field.onChange}
                    label="OpenGraph Image"
                  />
                )}
              />
            </div>

            <div className="space-y-4 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <TagIcon className="h-4 w-4 text-primary" /> Taxonomies
              </h3>

              <div className="space-y-3">
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
                        className="transition-colors hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {fields.length === 0 && (
                    <p className="text-[9px] italic text-muted-foreground">
                      No tags assigned
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
