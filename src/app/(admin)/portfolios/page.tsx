'use client';

import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Plus,
  Globe,
  Edit,
  Trash2,
  Shield,
  X,
  Loader2,
  AlertCircle,
  Eye,
  KeyRound,
} from 'lucide-react';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  usePortfolios,
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
  useRegenerateApiKey,
} from '@/hooks/use-portfolios';
import { Skeleton } from '@/components/ui/skeleton';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PortfolioSchema } from '@/schemas/cms';
import { Portfolio } from '@/types/cms';
import { CopyButton } from '@/components/ui/CopyButton';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

export default function PortfoliosPage() {
  const { data: portfoliosResponse, isLoading, isError } = usePortfolios();
  const portfolios = portfoliosResponse?.data || [];

  const createMutation = useCreatePortfolio();
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();
  const regenerateApiKeyMutation = useRegenerateApiKey();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(
    null
  );
  const [detailPortfolio, setDetailPortfolio] = useState<Portfolio | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    'general' | 'branding' | 'infrastructure' | 'scripts' | 'social'
  >('general');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<Portfolio>({
    resolver: zodResolver(PortfolioSchema.omit({ _id: true })),
    defaultValues: {
      name: '',
      domain: '',
      active: true,
      newsletterConfig: {
        senderName: '',
        senderEmail: '',
        replyTo: '',
        accentColor: '#00ff00',
        logoUrl: '',
        footerText: '',
      },
      smtpConfig: {
        host: '',
        port: 587,
        user: '',
        pass: '',
        secure: false,
      },
      customScripts: {
        head: '',
        footer: '',
      },
      socialLinks: [],
      maintenanceMode: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'socialLinks',
  });

  const openModal = (portfolio?: Portfolio) => {
    if (portfolio) {
      setEditingPortfolio(portfolio);
      reset({
        ...portfolio,
        active: portfolio.active !== false,
      });
    } else {
      setEditingPortfolio(null);
      reset({ name: '', domain: '', active: true });
    }
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPortfolio(null);
    reset();
  };

  const onSubmit = (data: Portfolio) => {
    if (editingPortfolio) {
      updateMutation.mutate(
        { id: editingPortfolio._id!, data },
        {
          onSuccess: () => closeModal(),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => closeModal(),
      });
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const handleDeleteTrigger = (id: string) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!targetId) return;
    deleteMutation.mutate(targetId, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  const [apiKeyConfirmOpen, setApiKeyConfirmOpen] = useState(false);
  const [apiKeyTargetId, setApiKeyTargetId] = useState<string | null>(null);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);

  const handleRegenerateApiKeyTrigger = (id: string) => {
    setApiKeyTargetId(id);
    setApiKeyConfirmOpen(true);
  };

  const handleConfirmRegenerateApiKey = () => {
    if (!apiKeyTargetId) return;
    regenerateApiKeyMutation.mutate(apiKeyTargetId, {
      onSuccess: (response) => {
        setApiKeyConfirmOpen(false);
        setGeneratedApiKey(response.data.apiKey);
      },
    });
  };

  return (
    <div className="relative min-h-full space-y-12 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mb-2 text-4xl font-semibold tracking-tight">
            Portfolios
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage isolated agency environments
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          className="h-12 gap-2 rounded-full shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Provision Portfolio
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="space-y-4 rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl"
            >
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : isError ? (
          <div className="col-span-full">
            <QueryErrorState />
          </div>
        ) : portfolios.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/5 p-24 text-center">
            <div className="mb-4 rounded-xl border border-border bg-background p-4 text-muted-foreground shadow-sm">
              <AlertCircle className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No active portfolios found
            </p>
            <p className="mt-2 text-xs text-muted-foreground/50">
              Provision your first environment to get started
            </p>
          </div>
        ) : (
          portfolios.map((portfolio) => (
            <div
              key={portfolio._id}
              className="group rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl transition-all hover:border-primary/50"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-secondary/50 p-2 text-primary transition-colors group-hover:bg-primary/20">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-tight">
                      {portfolio.name}
                    </h3>
                    <p className="flex items-center gap-2 font-mono text-[10px] italic text-muted-foreground">
                      {portfolio._id}
                      <CopyButton
                        value={portfolio._id!}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        iconSize={12}
                      />
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDetailPortfolio(portfolio)}
                    className="p-1.5 transition-colors hover:bg-secondary"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openModal(portfolio)}
                    className="p-1.5 transition-colors hover:bg-secondary"
                    title="Edit Portfolio"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTrigger(portfolio._id!)}
                    className="p-1.5 transition-colors hover:text-destructive"
                    title="Delete Portfolio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/20 p-2 font-mono text-xs">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  {portfolio.domain || 'no-domain.configured'}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-secondary/5 p-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Connectivity
                    </span>
                    <div className="flex gap-1.5">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          portfolio.newsletterConfig?.senderEmail
                            ? 'bg-primary'
                            : 'bg-muted'
                        )}
                        title="Newsletter Branding"
                      />
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          portfolio.smtpConfig?.host
                            ? 'bg-amber-500'
                            : 'bg-muted'
                        )}
                        title="Custom SMTP"
                      />
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          portfolio.customScripts?.head ||
                            portfolio.customScripts?.footer
                            ? 'bg-blue-500'
                            : 'bg-muted'
                        )}
                        title="Custom Scripts"
                      />
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          portfolio.apiKeyHash ? 'bg-emerald-500' : 'bg-muted'
                        )}
                        title="API Key"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-secondary/5 p-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Social
                    </span>
                    <span className="text-xs font-semibold">
                      {portfolio.socialLinks?.length || 0} Links
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        portfolio.active !== false ? 'default' : 'destructive'
                      }
                    >
                      {portfolio.active !== false ? 'Operational' : 'Suspended'}
                    </Badge>
                    {portfolio.maintenanceMode && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/50 text-amber-600"
                      >
                        Maintenance
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Provisioning Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-background/80" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card/95 p-8 shadow-xl backdrop-blur-xl focus:outline-none">
            <DialogPrimitive.Title className="sr-only">
              {editingPortfolio
                ? 'Modify Infrastructure'
                : 'Provision Portfolio'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-secondary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>

            <h3 className="mb-2 text-xl font-semibold tracking-tight">
              {editingPortfolio
                ? 'Modify Infrastructure'
                : 'Provision Portfolio'}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Environment: {editingPortfolio?.name || 'New Build'}
            </p>

            {/* Tabs Navigation */}
            <div className="mb-8 flex gap-1 overflow-hidden rounded-full border border-border bg-secondary/10 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={cn(
                  'flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === 'general'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-secondary'
                )}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                className={cn(
                  'flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === 'branding'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                )}
              >
                Branding
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('infrastructure')}
                className={cn(
                  'flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === 'infrastructure'
                    ? 'bg-amber-500 text-amber-950'
                    : 'hover:bg-secondary'
                )}
              >
                Infra
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('scripts')}
                className={cn(
                  'flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === 'scripts'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-secondary'
                )}
              >
                Scripts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={cn(
                  'flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === 'social'
                    ? 'bg-pink-500 text-white'
                    : 'hover:bg-secondary'
                )}
              >
                Social
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {activeTab === 'general' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
                  <div className="space-y-2">
                    <Label>Portfolio Name</Label>
                    <Input
                      {...register('name')}
                      placeholder="e.g. Saad Qadir Portfolio"
                    />
                    {errors.name && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Domain</Label>
                    <Input
                      {...register('domain')}
                      placeholder="saadqadir.com"
                    />
                    {errors.domain && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.domain.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-4 shadow-sm">
                      <Label htmlFor="active" className="cursor-pointer">
                        Operational Status
                      </Label>
                      <Checkbox id="active" {...register('active')} />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4 shadow-sm">
                      <Label
                        htmlFor="maintenanceMode"
                        className="cursor-pointer text-destructive"
                      >
                        Maintenance Mode
                      </Label>
                      <Checkbox
                        id="maintenanceMode"
                        {...register('maintenanceMode')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'branding' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 rounded-xl border border-border bg-primary/10 p-4 shadow-sm duration-300">
                  <p className="text-xs uppercase tracking-wide text-primary">
                    Newsletter Branding
                  </p>

                  <div className="space-y-2">
                    <Label>Sender Name</Label>
                    <Input
                      {...register('newsletterConfig.senderName')}
                      placeholder="e.g. Saad Qadir"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sender Email</Label>
                      <Input
                        {...register('newsletterConfig.senderEmail')}
                        placeholder="hello@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reply-To Email</Label>
                      <Input
                        {...register('newsletterConfig.replyTo')}
                        placeholder="support@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <Input
                        {...register('newsletterConfig.accentColor')}
                        placeholder="#00ff00"
                        type="color"
                        className="h-10 p-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input
                        {...register('newsletterConfig.logoUrl')}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Footer Text</Label>
                    <Input
                      {...register('newsletterConfig.footerText')}
                      placeholder="Unsubscribe at any time..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'infrastructure' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 rounded-xl border border-border bg-amber-500/10 p-4 shadow-sm duration-300">
                  <p className="text-xs uppercase tracking-wide text-amber-500">
                    SMTP Infrastructure (Private)
                  </p>

                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input
                      {...register('smtpConfig.host')}
                      placeholder="smtp.mailtrap.io"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input
                        type="number"
                        {...register('smtpConfig.port', {
                          valueAsNumber: true,
                        })}
                        placeholder="587"
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                      <Label className="text-[10px]">Secure (SSL)</Label>
                      <Checkbox {...register('smtpConfig.secure')} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input
                      {...register('smtpConfig.user')}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <Input
                      type="password"
                      {...register('smtpConfig.pass')}
                      placeholder="••••••••"
                    />
                    <p className="text-xs italic text-muted-foreground">
                      Passwords are AES-256 encrypted.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'infrastructure' && editingPortfolio && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 rounded-xl border border-border bg-secondary/10 p-4 shadow-sm duration-300">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-xs font-medium">
                      <KeyRound className="h-3.5 w-3.5" />
                      Client Site API Key
                    </p>
                    <Badge
                      variant={
                        editingPortfolio.apiKeyHash ? 'default' : 'outline'
                      }
                    >
                      {editingPortfolio.apiKeyHash ? 'Active' : 'Not set'}
                    </Badge>
                  </div>
                  <p className="text-xs italic text-muted-foreground">
                    Used by your external website (server-side only) to
                    authenticate with this CMS instead of domain matching —
                    works identically on localhost and in production.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() =>
                      handleRegenerateApiKeyTrigger(editingPortfolio._id!)
                    }
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {editingPortfolio.apiKeyHash
                      ? 'Regenerate API Key'
                      : 'Generate API Key'}
                  </Button>
                </div>
              )}

              {activeTab === 'scripts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 rounded-xl border border-border bg-blue-500/10 p-4 shadow-sm duration-300">
                  <p className="text-xs uppercase tracking-wide text-blue-500">
                    Custom Script Injection
                  </p>

                  <div className="space-y-2">
                    <Label>Head Scripts (GA, GTM, Meta Pixel)</Label>
                    <Textarea
                      {...register('customScripts.head')}
                      placeholder="<script>...</script>"
                      rows={5}
                      className="font-mono text-[10px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Footer Scripts (Chat, Tracking)</Label>
                    <Textarea
                      {...register('customScripts.footer')}
                      placeholder="<script>...</script>"
                      rows={5}
                      className="font-mono text-[10px]"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 rounded-xl border border-border bg-pink-500/10 p-4 shadow-sm duration-300">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-pink-500">
                      Social Connectivity
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 gap-1 rounded-full border-pink-500/30 text-xs hover:bg-pink-500/10"
                      onClick={() => append({ platform: '', url: '' })}
                    >
                      <Plus className="h-3 w-3" />
                      Add Link
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="group relative grid grid-cols-12 gap-2 rounded-xl border border-border bg-background/50 p-2 transition-all hover:border-pink-500/50"
                      >
                        <div className="col-span-4">
                          <Label className="text-xs uppercase opacity-50">
                            Platform
                          </Label>
                          <Input
                            {...register(`socialLinks.${index}.platform`)}
                            placeholder="LinkedIn, X, etc..."
                            className="h-8 border-0 bg-transparent px-0 text-xs focus-visible:ring-0"
                          />
                        </div>
                        <div className="col-span-7">
                          <Label className="text-xs uppercase opacity-50">
                            URL
                          </Label>
                          <Input
                            {...register(`socialLinks.${index}.url`)}
                            placeholder="https://..."
                            className="h-8 border-0 bg-transparent px-0 text-xs focus-visible:ring-0"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {fields.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border/30 py-8 text-center">
                        <p className="text-xs font-medium text-muted-foreground">
                          No social links added
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-[2]"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  {editingPortfolio ? 'Update System' : 'Initialize'}
                </Button>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Portfolio?"
        message="Warning: Deleting a portfolio will permanently remove all associated blogs, projects, and media assets. This action is irreversible."
        confirmText="Proceed with Deletion"
        requireTextMatch={portfolios?.find((p) => p._id === targetId)?.name}
      />

      <BrutalConfirm
        isOpen={apiKeyConfirmOpen}
        onClose={() => setApiKeyConfirmOpen(false)}
        onConfirm={handleConfirmRegenerateApiKey}
        isLoading={regenerateApiKeyMutation.isPending}
        title="Regenerate API Key?"
        message="This immediately invalidates the current key. Any client website still using the old key will stop being able to authenticate until it's updated with the new one."
        confirmText="Regenerate Key"
      />

      {/* Generated API Key Reveal (shown exactly once) */}
      <Dialog
        open={!!generatedApiKey}
        onOpenChange={(open) => {
          if (!open) setGeneratedApiKey(null);
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-background/80" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-500/30 bg-card/95 p-8 shadow-xl backdrop-blur-xl focus:outline-none">
            <DialogPrimitive.Title asChild>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  New API Key
                </h3>
              </div>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description asChild>
              <p className="mb-4 text-sm font-medium text-destructive">
                Copy this now — it will not be shown again.
              </p>
            </DialogPrimitive.Description>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/20 p-3">
              <code className="flex-1 truncate font-mono text-xs">
                {generatedApiKey}
              </code>
              <CopyButton value={generatedApiKey || ''} iconSize={14} />
            </div>
            <Button
              className="mt-6 w-full"
              onClick={() => setGeneratedApiKey(null)}
            >
              Done
            </Button>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={!!detailPortfolio}
        onOpenChange={(open) => {
          if (!open) setDetailPortfolio(null);
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-background/80" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card/95 p-6 shadow-xl backdrop-blur-xl focus:outline-none md:p-10">
            <DialogPrimitive.Title className="sr-only">
              {detailPortfolio?.name}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-secondary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
            {detailPortfolio && (
              <>
                <div className="mb-8 flex items-center gap-5">
                  <div className="rounded-2xl border border-border bg-primary/20 p-3 shadow-sm">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-2xl font-semibold leading-none tracking-tight">
                      {detailPortfolio.name}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground/70">
                      <span className="uppercase tracking-wide">ID:</span>
                      <span className="rounded bg-secondary/40 px-1.5 py-0.5">
                        {detailPortfolio._id}
                      </span>
                      <CopyButton
                        value={detailPortfolio._id!}
                        iconSize={12}
                        className="opacity-60 hover:opacity-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-secondary/50 p-4 shadow-sm">
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        Primary Domain
                      </p>
                      <p className="break-all font-mono text-xs leading-relaxed text-primary underline decoration-primary/30 underline-offset-4">
                        {detailPortfolio.domain || 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/50 p-4 shadow-sm">
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        System Status
                      </p>
                      <Badge
                        variant={
                          detailPortfolio.active !== false
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {detailPortfolio.active !== false
                          ? 'Active'
                          : 'Suspended'}
                      </Badge>
                    </div>
                  </div>

                  {/* Advanced Configuration Status */}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-primary/10 p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-primary">
                          Branding & Newsletter
                        </p>
                        <Badge
                          variant={
                            detailPortfolio.newsletterConfig?.senderEmail
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {detailPortfolio.newsletterConfig?.senderEmail
                            ? 'Configured'
                            : 'Missing'}
                        </Badge>
                      </div>
                      {detailPortfolio.newsletterConfig?.senderEmail && (
                        <div className="space-y-4 text-xs font-medium">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="mb-1 text-muted-foreground">
                                Sender Identity
                              </p>
                              <p>
                                {detailPortfolio.newsletterConfig.senderName}
                              </p>
                              <p className="break-all text-muted-foreground/60">
                                {detailPortfolio.newsletterConfig.senderEmail}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-muted-foreground">
                                Theme & Assets
                              </p>
                              <div className="mb-1 flex items-center gap-2">
                                <div
                                  className="h-4 w-4 border border-foreground"
                                  style={{
                                    backgroundColor:
                                      detailPortfolio.newsletterConfig
                                        .accentColor || '#000',
                                  }}
                                />
                                <span>
                                  {detailPortfolio.newsletterConfig.accentColor}
                                </span>
                              </div>
                              <p
                                className="truncate text-muted-foreground/60"
                                title={
                                  detailPortfolio.newsletterConfig.logoUrl ||
                                  'N/A'
                                }
                              >
                                Logo:{' '}
                                {detailPortfolio.newsletterConfig.logoUrl
                                  ? 'SET'
                                  : 'MISSING'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 border-t border-primary/10 pt-2">
                            <div>
                              <p className="mb-1 text-muted-foreground">
                                Reply-To
                              </p>
                              <p className="break-all">
                                {detailPortfolio.newsletterConfig.replyTo ||
                                  'Same as sender'}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-muted-foreground">
                                Footer Context
                              </p>
                              <p
                                className="truncate"
                                title={
                                  detailPortfolio.newsletterConfig.footerText ||
                                  'N/A'
                                }
                              >
                                {detailPortfolio.newsletterConfig.footerText ||
                                  'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-amber-600">
                          SMTP Infrastructure
                        </p>
                        <Badge
                          variant={
                            detailPortfolio.smtpConfig?.host
                              ? 'default'
                              : 'outline'
                          }
                          className="border-amber-500 text-amber-600"
                        >
                          {detailPortfolio.smtpConfig?.host
                            ? 'Active'
                            : 'Default'}
                        </Badge>
                      </div>
                      {detailPortfolio.smtpConfig?.host && (
                        <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                          <div>
                            <p className="mb-1 text-muted-foreground">
                              Endpoint
                            </p>
                            <p className="break-all">
                              {detailPortfolio.smtpConfig.host}:
                              {detailPortfolio.smtpConfig.port}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-muted-foreground">
                              Security
                            </p>
                            <p>
                              {detailPortfolio.smtpConfig.secure
                                ? 'SSL/TLS'
                                : 'STARTTLS'}
                            </p>
                            <p className="text-muted-foreground/60">
                              {detailPortfolio.smtpConfig.user}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-blue-600">
                          Injected Scripts
                        </p>
                        <Badge
                          variant={
                            detailPortfolio.customScripts?.head ||
                            detailPortfolio.customScripts?.footer
                              ? 'default'
                              : 'outline'
                          }
                          className="border-blue-500 text-blue-600"
                        >
                          {detailPortfolio.customScripts?.head ||
                          detailPortfolio.customScripts?.footer
                            ? 'Active'
                            : 'None'}
                        </Badge>
                      </div>
                      {(detailPortfolio.customScripts?.head ||
                        detailPortfolio.customScripts?.footer) && (
                        <div className="space-y-2 font-mono text-xs text-muted-foreground">
                          {detailPortfolio.customScripts.head && (
                            <p>• Header Scripts Active</p>
                          )}
                          {detailPortfolio.customScripts.footer && (
                            <p>• Footer Scripts Active</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-600">
                          <KeyRound className="h-3.5 w-3.5" />
                          Client Site API Key
                        </p>
                        <Badge
                          variant={
                            detailPortfolio.apiKeyHash ? 'default' : 'outline'
                          }
                          className="border-emerald-500 text-emerald-600"
                        >
                          {detailPortfolio.apiKeyHash ? 'Active' : 'Not Set'}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-pink-600">
                          Social Connectivity
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detailPortfolio.socialLinks?.map((link, idx) => (
                          <Badge
                            key={idx}
                            className="bg-pink-100 text-pink-700 hover:bg-pink-100"
                          >
                            {link.platform}
                          </Badge>
                        ))}
                        {(!detailPortfolio.socialLinks ||
                          detailPortfolio.socialLinks.length === 0) && (
                          <p className="text-xs italic text-muted-foreground">
                            No social links configured
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      variant="outline"
                      className="w-full rounded-full py-8 font-semibold shadow-sm transition-colors hover:bg-secondary"
                      onClick={() => {
                        setDetailPortfolio(null);
                        openModal(detailPortfolio);
                      }}
                    >
                      <Edit className="mr-2 h-5 w-5" />
                      Reconfigure Infrastructure
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
