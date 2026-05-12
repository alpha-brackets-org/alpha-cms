/**
 * CMS Type Definitions
 *
 * NOTE: These types are now inferred from Zod schemas in src/schemas/cms.ts
 */

export {
  CollectionName,
  PublishStatus,
  SubscriberStatus,
  SubscriberSource,
  UserRole,
} from '@/schemas/cms';
import {
  Blog as BlogType,
  CaseStudy as CaseStudyType,
  Media as MediaType,
  Portfolio as PortfolioType,
  User as UserType,
  Category as CategoryType,
  Stats as StatsType,
  SEOMetadata as SEOMetadataType,
  PopulatedBlog as PopulatedBlogType,
  PopulatedCaseStudy as PopulatedCaseStudyType,
  PopulatedProject as PopulatedProjectType,
  AnalyticsSchema,
  SubscriberSchema,
  ProjectSchema,
  LeadSchema,
  CampaignSchema,
  FaqSchema,
  Tag as TagType,
} from '@/schemas/cms';
import z from 'zod';

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
export type CategoryFilters = BaseFilters;
export type SubscriberFilters = BaseFilters;
export type ProjectFilters = BaseFilters;
export type LeadFilters = BaseFilters;

/**
 * TanStack Query Metadata Types
 */
declare module '@tanstack/react-query' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Register {
    mutationMeta: {
      successMessage?: string;
    };
  }
}

/**
 * MongoDB Utility Types
 */
export type MongoQuery = {
  [key: string]: unknown;
  $or?: Record<string, unknown>[];
  $and?: Record<string, unknown>[];
};
export type MongoPipeline = Record<string, unknown>[];

export type SEOMetadata = SEOMetadataType;
export type Blog = BlogType;
export type PopulatedBlog = PopulatedBlogType;
export type CaseStudy = CaseStudyType;
export type PopulatedCaseStudy = PopulatedCaseStudyType;
export type PopulatedProject = PopulatedProjectType;
export type Media = MediaType;
export type Portfolio = PortfolioType;
export type User = UserType;
export type Tag = TagType;
export type Category = CategoryType;
export type Stats = StatsType;
export type Subscriber = z.infer<typeof SubscriberSchema>;
export type Analytics = z.infer<typeof AnalyticsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type Faq = z.infer<typeof FaqSchema>;

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
