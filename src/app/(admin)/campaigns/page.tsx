'use client';

import React, { useState } from 'react';
import {
  Send,
  Plus,
  Mail,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  X,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import {
  useCampaigns,
  useCreateCampaign,
  useSendCampaign,
} from '@/hooks/use-campaigns';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () =>
    import('@/components/cms/RichTextEditor').then((mod) => mod.RichTextEditor),
  { ssr: false }
);

export default function CampaignsPage() {
  const { activePortfolio } = usePortfolio();
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const { data: response, isLoading } = useCampaigns({
    portfolio: activePortfolio || undefined,
  });

  const createMutation = useCreateCampaign();
  const sendMutation = useSendCampaign();

  const campaigns = response?.data || [];

  const handleCreate = () => {
    if (!activePortfolio) {
      error('ERROR', 'Please select a portfolio first');
      return;
    }

    createMutation.mutate(
      {
        subject,
        content,
        portfolio: activePortfolio,
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setSubject('');
          setContent('');
          success('CAMPAIGN CREATED', 'Broadcast is ready to send.');
        },
      }
    );
  };

  const handleSend = (id: string) => {
    sendMutation.mutate(id, {
      onSuccess: (data) => {
        success(
          'CAMPAIGN SENT',
          `Successfully sent to ${data.sent} subscribers.`
        );
      },
    });
  };

  return (
    <div className="space-y-12 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold uppercase tracking-tight">
            Newsletter Campaigns
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Manual broadcasts and email marketing history
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          CREATE BROADCAST
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full border-2 border-border" />
          ))
        ) : campaigns.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-border py-20 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              No campaigns found
            </p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="group border-2 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:border-primary"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'border-2 border-border p-2',
                      campaign.status === 'sent'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    )}
                  >
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="line-clamp-1 font-bold uppercase tracking-tight">
                      {campaign.subject}
                    </h3>
                    <p className="font-mono text-[9px] text-muted-foreground">
                      ID: {campaign._id}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={campaign.status === 'sent' ? 'default' : 'secondary'}
                  className="uppercase tracking-widest"
                >
                  {campaign.status}
                </Badge>
              </div>

              <div className="my-4 grid grid-cols-2 gap-4 border-y-2 border-border/50 py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="text-[10px] font-bold uppercase">
                    <span className="text-primary">
                      {campaign.recipientCount}
                    </span>{' '}
                    Recipients
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-[10px] font-bold uppercase">
                    {campaign.sentAt
                      ? new Date(campaign.sentAt).toLocaleDateString()
                      : 'Scheduled'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  {campaign.stats && (
                    <>
                      <div className="text-[9px] font-black uppercase">
                        Opens:{' '}
                        <span className="text-primary">
                          {campaign.stats.opens}
                        </span>
                      </div>
                      <div className="text-[9px] font-black uppercase">
                        Clicks:{' '}
                        <span className="text-primary">
                          {campaign.stats.clicks}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/campaigns/${campaign._id}`}
                    className="flex h-8 w-8 items-center justify-center border-2 border-border bg-secondary/50 transition-all hover:border-primary hover:bg-secondary"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  {campaign.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSend(campaign._id)}
                      disabled={sendMutation.isPending}
                      className="h-8 gap-2 bg-amber-500 text-amber-950 hover:bg-amber-600"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      SEND NOW
                    </Button>
                  )}
                  {campaign.status === 'sent' && (
                    <Badge
                      variant="outline"
                      className="h-8 gap-1 border-primary text-primary"
                    >
                      <CheckCircle2 className="h-3 w-3" /> COMPLETED
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col border-4 border-foreground bg-card shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-4 border-foreground bg-secondary/20 p-6">
              <h3 className="text-xl font-bold uppercase tracking-tight">
                Create New Broadcast
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">
                  Email Subject Line
                </Label>
                <Input
                  placeholder="e.g. Exciting updates from our studio!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-12 text-lg font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">
                  Campaign Content
                </Label>
                <div className="min-h-[400px]">
                  <RichTextEditor content={content} onChange={setContent} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t-4 border-foreground bg-secondary/10 p-6">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-2 border-foreground"
              >
                DISCARD
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!subject || !content || createMutation.isPending}
                className="border-2 border-foreground px-8"
              >
                {createMutation.isPending ? 'CREATING...' : 'SAVE AS DRAFT'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
