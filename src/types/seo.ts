export enum SeoStatus {
  PERFECT = 'perfect',
  WARNING = 'warning',
  ERROR = 'error',
  NEUTRAL = 'neutral',
}

export interface SeoFactor {
  label: string;
  status: SeoStatus;
  message: string;
}

export interface SeoAnalyzerProps {
  title: string;
  description: string;
  content: string;
  keywords: string;
  ogImage: string;
}
