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
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BrutalTable,
  BrutalTableRow,
  BrutalTableCell,
} from '@/components/ui/BrutalTable';
import { BrutalPagination } from '@/components/ui/BrutalPagination';
import { useToast } from '@/hooks/use-toast';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
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

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const {
    data: response,
    isLoading,
    isError,
  } = useCampaigns({
    portfolio: activePortfolio || undefined,
    page,
    limit,
  });

  const createMutation = useCreateCampaign();
  const sendMutation = useSendCampaign();

  const campaigns = response?.data || [];
  const total = response?.pagination.total || 0;
  const hasNextPage = response?.pagination.hasNextPage || false;
  const hasPrevPage = response?.pagination.hasPrevPage || false;

  const handleCreate = () => {
    if (!activePortfolio) {
      error('Error', 'Please select a portfolio first');
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
          success('Campaign Created', 'Broadcast is ready to send.');
        },
      }
    );
  };

  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [targetSendId, setTargetSendId] = useState<string | null>(null);

  const handleSendTrigger = (id: string) => {
    setTargetSendId(id);
    setSendConfirmOpen(true);
  };

  const handleConfirmSend = () => {
    if (!targetSendId) return;
    sendMutation.mutate(targetSendId, {
      onSuccess: (res) => {
        setSendConfirmOpen(false);
        success(
          'Campaign Sent',
          `Successfully sent to ${res.data.sent} subscribers.`
        );
      },
    });
  };

  return (
    <div className="space-y-12 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-semibold tracking-tight">
            Newsletter Campaigns
          </h2>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Manual broadcasts and email marketing history
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Broadcast
        </Button>
      </div>

      {/* Campaigns Table */}
      <BrutalTable
        headers={['Campaign', 'Recipients', 'Performance', 'Sent', 'Actions']}
      >
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <BrutalTableRow key={i}>
              <BrutalTableCell>
                <Skeleton className="mb-2 h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-16" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-24" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-20" />
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-8" />
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        ) : isError ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={5}>
              <QueryErrorState />
            </BrutalTableCell>
          </BrutalTableRow>
        ) : campaigns.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={5} className="p-20 text-center">
              <div className="flex flex-col items-center gap-4 opacity-40">
                <Mail className="h-12 w-12" />
                <p className="text-xs uppercase tracking-wide">
                  No campaigns found
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          campaigns.map((campaign) => (
            <BrutalTableRow key={campaign._id} className="group">
              <BrutalTableCell>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'rounded-full border border-border p-2',
                      campaign.status === 'sent'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="line-clamp-1 text-sm font-semibold tracking-tight">
                      {campaign.subject}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          campaign.status === 'sent' ? 'default' : 'secondary'
                        }
                        className="text-[10px] uppercase tracking-wide"
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-primary">
                    {campaign.recipientCount}
                  </span>
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                {campaign.stats ? (
                  <div className="flex gap-3 text-[10px] font-medium uppercase tracking-wide">
                    <span>
                      Opens:{' '}
                      <span className="text-primary">
                        {campaign.stats.opens}
                      </span>
                    </span>
                    <span>
                      Clicks:{' '}
                      <span className="text-primary">
                        {campaign.stats.clicks}
                      </span>
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground opacity-50">
                    —
                  </span>
                )}
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {campaign.sentAt
                    ? new Date(campaign.sentAt).toLocaleDateString()
                    : 'Scheduled'}
                </div>
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-40 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/campaigns/${campaign._id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-secondary/50 transition-colors hover:border-border hover:bg-secondary"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  {campaign.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendTrigger(campaign._id!)}
                      disabled={sendMutation.isPending}
                      className="h-8 gap-2 bg-amber-500 text-amber-950 hover:bg-amber-600"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Send
                    </Button>
                  )}
                  {campaign.status === 'sent' && (
                    <Badge
                      variant="outline"
                      className="h-8 gap-1 border-primary text-primary"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                  )}
                </div>
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        )}
      </BrutalTable>

      {/* Pagination */}
      {response && response.pagination.totalPages > 1 && (
        <BrutalPagination
          currentPage={page}
          totalPages={response.pagination.totalPages}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          onPageChange={setPage}
          totalItems={total}
          itemsCount={campaigns.length}
          label="CAMPAIGNS"
        />
      )}

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex max-h-[95vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>Create New Broadcast</DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Email Subject Line
              </Label>
              <Input
                placeholder="e.g. Exciting updates from our studio!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-12 text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Campaign Content
              </Label>
              <div className="min-h-[400px]">
                <RichTextEditor content={content} onChange={setContent} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!subject || !content || createMutation.isPending}
              className="px-8"
            >
              {createMutation.isPending ? 'Creating...' : 'Save as Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
