import React from 'react';
import { Badge } from '@/components/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  // Publish statuses
  published: 'default',
  draft: 'secondary',
  archived: 'outline',
  // Campaign statuses
  sent: 'default',
  failed: 'destructive',
  // Lead statuses
  new: 'default',
  contacted: 'secondary',
  qualified: 'default',
  disqualified: 'destructive',
  // Subscriber statuses
  active: 'default',
  unsubscribed: 'outline',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * StatusBadge — maps any CMS status string to the correct Badge variant.
 * Covers PublishStatus, LeadStatus, SubscriberStatus, TestimonialStatus, etc.
 * Use this instead of inline ternaries or local STATUS_COLORS maps.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant: BadgeVariant = STATUS_VARIANT_MAP[status] ?? 'outline';

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
