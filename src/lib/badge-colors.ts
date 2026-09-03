import { SubscriberSource } from '@/schemas/cms';

const SUBSCRIBER_SOURCE_COLORS: Record<SubscriberSource, string> = {
  [SubscriberSource.NEWSLETTER]: 'border-blue-500 text-blue-500 bg-blue-500/5',
  [SubscriberSource.CASE_STUDY_DOWNLOAD]:
    'border-amber-500 text-amber-500 bg-amber-500/5',
  [SubscriberSource.MANUAL]:
    'border-purple-500 text-purple-500 bg-purple-500/5',
};

/**
 * Maps a SubscriberSource to its badge color classes + display label.
 * Single source of truth so list views don't reimplement this per-page.
 */
export function getSubscriberSourceStyle(source: SubscriberSource) {
  return {
    color:
      SUBSCRIBER_SOURCE_COLORS[source] ??
      SUBSCRIBER_SOURCE_COLORS[SubscriberSource.NEWSLETTER],
    label: source.replace(/_/g, ' ').toUpperCase(),
  };
}
