'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  usePortfolios,
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
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

export default function PortfoliosPage() {
  const { data: portfolios = [], isLoading } = usePortfolios();

  const createMutation = useCreatePortfolio();
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();

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
        { id: editingPortfolio._id, data },
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

  return (
    <div className="relative min-h-full space-y-12 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mb-2 text-4xl font-black uppercase tracking-tighter">
            Portfolios
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Manage isolated agency environments
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          className="h-12 gap-2 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus className="h-5 w-5" />
          PROVISION PORTFOLIO
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="space-y-4 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : portfolios.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-border bg-secondary/5 p-24 text-center">
            <div className="mb-4 border-2 border-border bg-background p-4 text-muted-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              No active portfolios found
            </p>
            <p className="mt-2 text-[8px] uppercase tracking-widest text-muted-foreground/50">
              Provision your first environment to get started
            </p>
          </div>
        ) : (
          portfolios.map((portfolio) => (
            <div
              key={portfolio._id}
              className="group border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:border-primary"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="border-2 border-border bg-secondary p-2 text-primary transition-colors group-hover:border-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-tight">
                      {portfolio.name}
                    </h3>
                    <p className="flex items-center gap-2 font-mono text-[10px] italic text-muted-foreground">
                      {portfolio._id}
                      <CopyButton
                        value={portfolio._id}
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
                    onClick={() => handleDeleteTrigger(portfolio._id)}
                    className="p-1.5 transition-colors hover:text-destructive"
                    title="Delete Portfolio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-2 border-border bg-secondary/20 p-2 font-mono text-xs">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  {portfolio.domain || 'no-domain.configured'}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 border border-border/50 bg-secondary/5 p-2">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
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
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 border border-border/50 bg-secondary/5 p-2">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                      Social
                    </span>
                    <span className="text-[10px] font-black">
                      {portfolio.socialLinks?.length || 0} LINKS
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        portfolio.active !== false ? 'default' : 'destructive'
                      }
                      className="text-[8px] font-black uppercase tracking-widest"
                    >
                      {portfolio.active !== false ? 'Operational' : 'Suspended'}
                    </Badge>
                    {portfolio.maintenanceMode && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/50 text-[8px] font-black uppercase tracking-widest text-amber-600"
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
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto border-4 border-foreground bg-card p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-2 transition-colors hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="mb-2 text-xl font-bold uppercase tracking-tight">
              {editingPortfolio
                ? 'Modify Infrastructure'
                : 'Provision Portfolio'}
            </h3>
            <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Environment: {editingPortfolio?.name || 'New Build'}
            </p>

            {/* Tabs Navigation */}
            <div className="mb-8 flex border-2 border-foreground bg-secondary/10">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={cn(
                  'flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
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
                  'flex-1 border-x-2 border-foreground px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
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
                  'flex-1 border-r-2 border-foreground px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
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
                  'flex-1 border-r-2 border-foreground px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
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
                  'flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
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
                      <p className="text-[9px] font-bold uppercase text-destructive">
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
                      <p className="text-[9px] font-bold uppercase text-destructive">
                        {errors.domain.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-2 border-border bg-secondary/50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Label htmlFor="active" className="cursor-pointer">
                        Operational Status
                      </Label>
                      <Checkbox id="active" {...register('active')} />
                    </div>

                    <div className="flex items-center justify-between border-2 border-destructive/20 bg-destructive/5 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 border-2 border-primary/20 bg-primary/5 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-300">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">
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
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 border-2 border-amber-500/20 bg-amber-500/5 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-300">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
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
                    <p className="text-[8px] italic text-muted-foreground">
                      Passwords are AES-256 encrypted.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'scripts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 border-2 border-blue-500/20 bg-blue-500/5 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-300">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
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
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 border-2 border-pink-500/20 bg-pink-500/5 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-300">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-pink-600">
                      Social Connectivity
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 gap-1 border-pink-500/30 text-[8px] hover:bg-pink-500/10"
                      onClick={() => append({ platform: '', url: '' })}
                    >
                      <Plus className="h-3 w-3" />
                      ADD LINK
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="group relative grid grid-cols-12 gap-2 border-2 border-border/30 bg-background p-2 transition-all hover:border-pink-500/50"
                      >
                        <div className="col-span-4">
                          <Label className="text-[8px] uppercase opacity-50">
                            Platform
                          </Label>
                          <Input
                            {...register(`socialLinks.${index}.platform`)}
                            placeholder="LinkedIn, X, etc..."
                            className="h-8 border-0 bg-transparent px-0 text-[10px] focus-visible:ring-0"
                          />
                        </div>
                        <div className="col-span-7">
                          <Label className="text-[8px] uppercase opacity-50">
                            URL
                          </Label>
                          <Input
                            {...register(`socialLinks.${index}.url`)}
                            placeholder="https://..."
                            className="h-8 border-0 bg-transparent px-0 text-[10px] focus-visible:ring-0"
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
                      <div className="border-2 border-dashed border-border/30 py-8 text-center">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
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
                  className="flex-1 border-2 border-foreground"
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-[2] border-2 border-foreground"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  {editingPortfolio ? 'UPDATE SYSTEM' : 'INITIALIZE'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="DELETE PORTFOLIO?"
        message="WARNING: Deleting a portfolio will permanently remove all associated blogs, projects, and media assets. This action is irreversible."
        confirmText="PROCEED WITH DELETION"
        requireTextMatch={portfolios?.find((p) => p._id === targetId)?.name}
      />

      {/* Detail Modal */}
      {detailPortfolio && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-4 border-foreground bg-card p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] md:p-10">
            <button
              onClick={() => setDetailPortfolio(null)}
              className="absolute right-4 top-4 p-2 transition-colors hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-8 flex items-center gap-5">
              <div className="border-4 border-foreground bg-primary p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-black uppercase leading-none tracking-tighter">
                  {detailPortfolio.name}
                </h3>
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground/70">
                  <span className="uppercase tracking-widest">ID:</span>
                  <span className="bg-secondary/40 px-1.5 py-0.5">
                    {detailPortfolio._id}
                  </span>
                  <CopyButton
                    value={detailPortfolio._id}
                    iconSize={12}
                    className="opacity-60 hover:opacity-100"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border-2 border-border bg-secondary/5 p-4">
                  <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Primary Domain
                  </p>
                  <p className="break-all font-mono text-xs leading-relaxed text-primary underline decoration-primary/30 underline-offset-4">
                    {detailPortfolio.domain || 'N/A'}
                  </p>
                </div>
                <div className="border-2 border-border bg-secondary/5 p-4">
                  <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    System Status
                  </p>
                  <Badge
                    variant={
                      detailPortfolio.active !== false
                        ? 'default'
                        : 'destructive'
                    }
                    className="h-6 rounded-none border-2 border-current px-3 font-black tracking-widest"
                  >
                    {detailPortfolio.active !== false ? 'ACTIVE' : 'SUSPENDED'}
                  </Badge>
                </div>
              </div>

              {/* Advanced Configuration Status */}
              <div className="space-y-4">
                <div className="border-2 border-primary/20 bg-primary/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Branding & Newsletter
                    </p>
                    <Badge
                      variant={
                        detailPortfolio.newsletterConfig?.senderEmail
                          ? 'default'
                          : 'outline'
                      }
                      className="rounded-none border-2 border-primary text-[8px]"
                    >
                      {detailPortfolio.newsletterConfig?.senderEmail
                        ? 'CONFIGURED'
                        : 'MISSING'}
                    </Badge>
                  </div>
                  {detailPortfolio.newsletterConfig?.senderEmail && (
                    <div className="space-y-4 text-[10px] font-bold uppercase tracking-tight">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="mb-1 text-muted-foreground">
                            Sender Identity
                          </p>
                          <p>{detailPortfolio.newsletterConfig.senderName}</p>
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
                              detailPortfolio.newsletterConfig.logoUrl || 'N/A'
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
                          <p className="mb-1 text-muted-foreground">Reply-To</p>
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

                <div className="border-2 border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                      SMTP Infrastructure
                    </p>
                    <Badge
                      variant={
                        detailPortfolio.smtpConfig?.host ? 'default' : 'outline'
                      }
                      className="rounded-none border-2 border-amber-500 text-[8px] text-amber-600"
                    >
                      {detailPortfolio.smtpConfig?.host ? 'ACTIVE' : 'DEFAULT'}
                    </Badge>
                  </div>
                  {detailPortfolio.smtpConfig?.host && (
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-tight">
                      <div>
                        <p className="mb-1 text-muted-foreground">Endpoint</p>
                        <p className="break-all">
                          {detailPortfolio.smtpConfig.host}:
                          {detailPortfolio.smtpConfig.port}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-muted-foreground">Security</p>
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

                <div className="border-2 border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                      Injected Scripts
                    </p>
                    <Badge
                      variant={
                        detailPortfolio.customScripts?.head ||
                        detailPortfolio.customScripts?.footer
                          ? 'default'
                          : 'outline'
                      }
                      className="rounded-none border-2 border-blue-500 text-[8px] text-blue-600"
                    >
                      {detailPortfolio.customScripts?.head ||
                      detailPortfolio.customScripts?.footer
                        ? 'ACTIVE'
                        : 'NONE'}
                    </Badge>
                  </div>
                  {(detailPortfolio.customScripts?.head ||
                    detailPortfolio.customScripts?.footer) && (
                    <div className="space-y-2 font-mono text-[9px] text-muted-foreground">
                      {detailPortfolio.customScripts.head && (
                        <p>• Header Scripts Active</p>
                      )}
                      {detailPortfolio.customScripts.footer && (
                        <p>• Footer Scripts Active</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-2 border-pink-500/20 bg-pink-500/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-pink-600">
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
                      <p className="text-[10px] italic text-muted-foreground">
                        No social links configured
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  variant="outline"
                  className="w-full border-4 border-foreground py-8 font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                  onClick={() => {
                    setDetailPortfolio(null);
                    openModal(detailPortfolio);
                  }}
                >
                  <Edit className="mr-2 h-5 w-5" />
                  RECONFIGURE INFRASTRUCTURE
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
