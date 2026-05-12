'use client';

import React from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CampaignDetailPage() {
  const { id } = useParams() as { id: string };
  const { success, error } = useToast();

  const { data: campaign, isLoading } = useCampaign(id);
  const sendMutation = useSendCampaign();

  const handleSend = () => {
    if (!campaign) return;
    sendMutation.mutate(campaign._id, {
      onSuccess: (data) => {
        success(
          'CAMPAIGN SENT',
          `Successfully sent to ${data.sent} subscribers.`
        );
      },
      onError: (err) => {
        error('SEND FAILED', err.message);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8">
        <Skeleton className="h-16 w-full border-2 border-border" />
        <Skeleton className="h-[600px] w-full border-2 border-border" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center font-bold uppercase tracking-widest text-muted-foreground">
        Campaign not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b-4 border-foreground bg-secondary/80 p-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/campaigns"
            className="border-2 border-transparent p-2 transition-all hover:border-foreground hover:bg-background"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">
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
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="gap-2 border-2 border-foreground bg-amber-500 text-amber-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-600"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              FIRE BROADCAST
            </Button>
          )}
          {campaign.status === 'sent' && (
            <Badge className="gap-2 border-2 border-foreground bg-primary px-4 py-2 text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="h-4 w-4" /> COMPLETED
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-8 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Preview */}
          <div className="space-y-8 lg:col-span-2">
            <div className="border-4 border-foreground bg-card p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-8 border-b-2 border-foreground pb-6">
                <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Subject Line
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-primary">
                  {campaign.subject}
                </h1>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="min-h-[400px] border-2 border-border bg-secondary/5 p-8 font-serif leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: campaign.content }}
                />
              </div>
            </div>
          </div>

          {/* Metrics & Meta */}
          <div className="space-y-8">
            <div className="border-4 border-foreground bg-secondary/20 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="mb-4 flex items-center gap-2 border-b-2 border-foreground pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <Users className="h-4 w-4 text-primary" /> Campaign Performance
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Recipients
                    </p>
                    <p className="text-2xl font-black">
                      {campaign.recipientCount}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Status
                    </p>
                    <Badge className="uppercase">{campaign.status}</Badge>
                  </div>
                </div>

                <div className="space-y-4 border-t-2 border-foreground/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Sent At
                    </span>
                    <span className="font-mono text-xs">
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleString()
                        : 'PENDING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Created
                    </span>
                    <span className="font-mono text-xs">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-4 border-border bg-card p-6 opacity-60">
              <h3 className="mb-4 flex items-center gap-2 border-b-2 border-border pb-3 text-xs font-bold uppercase tracking-ultrawide">
                <AlertCircle className="h-4 w-4" /> Internal Controls
              </h3>
              <p className="mb-4 text-[10px] italic leading-relaxed text-muted-foreground">
                Manual broadcasts are irreversible once sent. Ensure you have
                proofed the content and checked recipient filters.
              </p>
              <Button
                variant="destructive"
                className="h-10 w-full border-2 border-foreground"
                disabled
              >
                <Trash2 className="mr-2 h-4 w-4" /> DELETE CAMPAIGN
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
