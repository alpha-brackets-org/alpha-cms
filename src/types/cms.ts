/**
 * CMS Type Definitions — Single barrel for all CMS types.
 *
 * Rules:
 *  - Schemas (Zod) live in: src/schemas/cms.ts
 *  - Types (TypeScript) are defined/inferred there and re-exported here.
 *  - All application code imports from THIS file, not from @/schemas/cms directly.
 */

// =============================================================================
// ENUMS — re-exported so consumers never import from @/schemas/cms directly
// =============================================================================

export {
  CollectionName,
  PublishStatus,
  TestimonialStatus,
  MediaFolder,
  SubscriberStatus,
  SubscriberSource,
  LeadStatus,
  LeadSource,
  UserRole,
  AnalyticsEvent,
  ContentType,
} from '@/schemas/cms';

// =============================================================================
// DOMAIN TYPES — direct re-exports from @/schemas/cms inferred types
// =============================================================================

// Shared primitives
export type { SEOMetadata, Tag } from '@/schemas/cms';

// Content
export type {
  Blog,
  PopulatedBlog,
  CaseStudy,
  PopulatedCaseStudy,
  Project,
  PopulatedProject,
  Faq,
  Testimonial,
  PopulatedTestimonial,
} from '@/schemas/cms';

// Infrastructure
export type { Portfolio, Media, User, Category, Stats } from '@/schemas/cms';

// CRM / Marketing
export type {
  Lead,
  Subscriber,
  Campaign,
  Analytics,
} from '@/schemas/cms';

// =============================================================================
// POPULATED VARIANTS — resolved portfolio/category references
// =============================================================================

import type { Lead, Subscriber, Category, Faq, Portfolio } from '@/schemas/cms';

export type PopulatedLead = Omit<Lead, 'portfolio'> & {
  portfolio: Portfolio;
};

export type PopulatedSubscriber = Omit<Subscriber, 'portfolio'> & {
  portfolio: Portfolio;
};

export type PopulatedCategory = Omit<Category, 'portfolio'> & {
  portfolio: Portfolio;
};

export type PopulatedFaq = Omit<Faq, 'portfolio'> & {
  portfolio: Portfolio;
};

// =============================================================================
// PAGINATION
// =============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

// =============================================================================
// FILTERS — used by hooks and API query builders
// =============================================================================

export interface BaseFilters {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined | null;
}

export type BlogFilters = BaseFilters;
export type CaseStudyFilters = BaseFilters;
export type ProjectFilters = BaseFilters;
export type CategoryFilters = BaseFilters;
export type LeadFilters = BaseFilters;
export type SubscriberFilters = BaseFilters;
export type FaqFilters = BaseFilters;
export type TestimonialFilters = BaseFilters;

// =============================================================================
// MONGODB UTILITY TYPES — used in API routes for raw query building
// =============================================================================

export type MongoQuery = {
  [key: string]: unknown;
  $or?: Record<string, unknown>[];
  $and?: Record<string, unknown>[];
};

export type MongoPipeline = Record<string, unknown>[];

// =============================================================================
// TANSTACK QUERY — global mutation metadata augmentation
// =============================================================================

declare module '@tanstack/react-query' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Register {
    mutationMeta: {
      successMessage?: string;
    };
  }
}
