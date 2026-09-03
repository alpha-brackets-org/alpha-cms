'use client';

import React, { useMemo, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useCampaign, useSendCampaign } from '@/hooks/use-campaigns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CampaignDetailPage() {
  const { id } = useParams() as { id: string };
  const { success, error } = useToast();

  const { data: campaignResponse, isLoading } = useCampaign(id);
  const campaign = campaignResponse?.data;
  const sendMutation = useSendCampaign();

  const sanitizedContent = useMemo(
    () => (campaign?.content ? DOMPurify.sanitize(campaign.content) : ''),
    [campaign?.content]
  );

  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);

  const handleConfirmSend = () => {
    if (!campaign) return;
    sendMutation.mutate(campaign._id!, {
      onSuccess: (res) => {
        setSendConfirmOpen(false);
        success(
          'Campaign Sent',
          `Successfully sent to ${res.data.sent} subscribers.`
        );
      },
      onError: (err) => {
        error('Send Failed', err.message);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8">
        <Skeleton className="h-16 w-full border border-border" />
        <Skeleton className="h-[600px] w-full border border-border" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center font-medium text-muted-foreground">
        Campaign not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-secondary/80 p-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/campaigns"
            className="rounded-full border border-transparent p-2 transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Campaign Preview
            </h2>
            <p className="font-mono text-[9px] lowercase text-primary">
              /campaigns/{id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {campaign.status === 'draft' && (
            <Button
              onClick={() => setSendConfirmOpen(true)}
              disabled={sendMutation.isPending}
              className="gap-2 bg-amber-500 text-amber-950 hover:bg-amber-600"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Fire Broadcast
            </Button>
          )}
          {campaign.status === 'sent' && (
            <Badge className="gap-2 bg-primary px-4 py-2 text-primary-foreground">
              <CheckCircle2 className="h-4 w-4" /> Completed
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-8 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Preview */}
          <div className="space-y-8 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
              <div className="mb-8 border-b border-border pb-6">
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Subject Line
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-primary">
                  {campaign.subject}
                </h1>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="min-h-[400px] rounded-xl border border-border bg-secondary/5 p-8 font-serif leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </div>
            </div>
          </div>

          {/* Metrics & Meta */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-secondary/20 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Users className="h-4 w-4 text-primary" /> Campaign Performance
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Recipients
                    </p>
                    <p className="text-2xl font-semibold">
                      {campaign.recipientCount}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <Badge>{campaign.status}</Badge>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Sent At
                    </span>
                    <span className="font-mono text-xs">
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleString()
                        : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Created
                    </span>
                    <span className="font-mono text-xs">
                      {campaign.createdAt
                        ? new Date(campaign.createdAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 opacity-60">
              <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <AlertCircle className="h-4 w-4" /> Internal Controls
              </h3>
              <p className="mb-4 text-xs italic leading-relaxed text-muted-foreground">
                Manual broadcasts are irreversible once sent. Ensure you have
                proofed the content and checked recipient filters.
              </p>
              <Button variant="destructive" className="h-10 w-full" disabled>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BrutalConfirm
        isOpen={sendConfirmOpen}
        onClose={() => setSendConfirmOpen(false)}
        onConfirm={handleConfirmSend}
        isLoading={sendMutation.isPending}
        title="Send this campaign?"
        message="This will immediately email every active subscriber for this portfolio. This action cannot be undone."
        confirmText="Send Now"
        isDestructive={false}
      />
    </div>
  );
}
