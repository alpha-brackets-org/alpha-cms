'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Save,
  ImageIcon,
  Settings,
  X,
  Code,
  Link as LinkIcon,
  Search,
  Loader2,
  Eye,
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
import { Project, PopulatedProject, PublishStatus } from '@/types/cms';
import dynamic from 'next/dynamic';
import { GithubIcon } from '@/components/icons/GithubIcon';

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(
  () =>
    import('@/components/cms/RichTextEditor').then((mod) => mod.RichTextEditor),
  { ssr: false }
);

interface ProjectFormProps {
  initialData?: PopulatedProject;
  onSubmit: (data: Project) => void;
  isLoading: boolean;
  submitText: string;
  isNew?: boolean;
}

export function ProjectForm({
  initialData,
  onSubmit,
  isLoading,
  submitText,
  isNew = false,
}: ProjectFormProps) {
  const [techInput, setTechInput] = useState('');
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
  } = useForm<Project>({
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      description: '',
      techStack: [],
      projectType: '',
      liveUrl: '',
      repoUrl: '',
      thumbnail: '',
      gallery: [],
      category: '',
      status: PublishStatus.DRAFT,
      featured: false,
      portfolio: '',
      seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        ogImage: '',
      },
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (initialData) {
      const { portfolio, category, ...rest } = initialData;

      reset({
        ...rest,
        portfolio: portfolio ? portfolio._id : '',
        category: category ? category._id : '',
        seo: rest.seo || {
          metaTitle: '',
          metaDescription: '',
          keywords: '',
          ogImage: '',
        },
        techStack: rest.techStack || [],
        gallery: rest.gallery || [],
      } as Project);
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
    window.open(`${baseUrl}/projects/${values.slug}`, '_blank');
  };

  const handleAddTech = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && techInput.trim()) {
      e.preventDefault();
      const currentTech = getValues('techStack') || [];
      if (!currentTech.includes(techInput.trim())) {
        reset({
          ...getValues(),
          techStack: [...currentTech, techInput.trim()],
        });
      }
      setTechInput('');
    }
  };

  const handleRemoveTech = (techToRemove: string) => {
    const currentTech = getValues('techStack') || [];
    reset({
      ...getValues(),
      techStack: currentTech.filter((s) => s !== techToRemove),
    });
  };

  const onFormSubmit = (data: Project) => {
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="flex min-h-full flex-col"
    >
      <div className="sticky top-0 z-50 flex items-center justify-between border-b-2 border-border bg-secondary/80 p-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="border-2 border-transparent p-2 transition-all hover:border-border hover:bg-background"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              {isNew ? 'New Project' : 'Editing Project'}
            </h2>
            <p className="font-mono text-[9px] lowercase text-primary">
              /projects/editor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Modified
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

      <div className="flex-1 space-y-8 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Main Area */}
          <div className="space-y-12 lg:col-span-3">
            <div className="space-y-4">
              <input
                {...register('title')}
                placeholder="Project Title"
                className={`w-full border-b-2 bg-transparent text-3xl font-bold transition-colors placeholder:text-muted-foreground/30 focus:outline-none md:text-4xl ${
                  errors.title
                    ? 'border-destructive'
                    : 'border-transparent focus:border-border/50'
                } pb-4`}
              />
              <div className="flex flex-wrap items-center gap-4 border-2 border-border/30 bg-secondary/20 p-3 font-mono text-[10px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase text-primary">
                    Slug:
                  </span>
                  <input
                    {...register('slug')}
                    placeholder="project-slug"
                    className="bg-transparent font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xl font-bold tracking-widest text-primary">
                Project Description
              </Label>
              <div className="space-y-4">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      content={field.value || ''}
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

                <div className="border-t border-border pt-6">
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

            {/* Links Section */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  <LinkIcon className="h-4 w-4" /> Live URL
                </Label>
                <Input
                  {...register('liveUrl')}
                  placeholder="https://example.com"
                  className="h-12 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  <GithubIcon className="h-4 w-4" /> Repository URL
                </Label>
                <Input
                  {...register('repoUrl')}
                  placeholder="https://github.com/..."
                  className="h-12 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SeoAnalyzer
              title={watchedValues.seo?.metaTitle || watchedValues.title}
              description={
                watchedValues.seo?.metaDescription || watchedValues.excerpt
              }
              content={watchedValues.description}
              keywords={watchedValues.seo?.keywords}
              ogImage={watchedValues.seo?.ogImage}
            />

            <div className="space-y-6 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <Settings className="h-4 w-4 text-primary" /> Settings
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

              <div className="space-y-2">
                <Label>Project Type</Label>
                <Input
                  {...register('projectType')}
                  placeholder="e.g. Web App, CLI..."
                  className="h-10 text-xs"
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-2 border-border bg-secondary/50 p-4">
                <Label className="flex cursor-pointer items-center gap-2">
                  Feature Project
                </Label>
                <Checkbox {...register('featured')} />
              </div>

              <div className="space-y-2">
                <Label>Short Excerpt</Label>
                <Textarea
                  {...register('excerpt')}
                  placeholder="Punchy summary..."
                  rows={3}
                  className="text-xs"
                />
                <CharCount
                  current={watchedValues.excerpt?.length || 0}
                  max={200}
                />
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-4 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <Code className="h-4 w-4 text-primary" /> Tech Stack
              </h3>
              <div className="space-y-3">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleAddTech}
                  placeholder="React, Next.js (Enter to add)"
                  className="h-10 text-[10px]"
                />
                <div className="flex flex-wrap gap-2">
                  {(getValues('techStack') || []).map((tech, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-1 border border-border bg-secondary px-2 py-1 text-foreground hover:bg-secondary/80"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="ml-1 transition-colors hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-6 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <ImageIcon className="h-4 w-4 text-primary" /> Visuals
              </h3>

              <Controller
                name="thumbnail"
                control={control}
                render={({ field }) => (
                  <MediaPicker
                    value={field.value}
                    onChange={field.onChange}
                    label="Main Thumbnail"
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
