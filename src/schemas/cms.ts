import { z } from '@/lib/zod-setup';

export enum CollectionName {
  BLOGS = 'blogs',
  CASE_STUDIES = 'case-studies',
  PROJECTS = 'projects',
  MEDIA = 'media',
  PORTFOLIOS = 'portfolios',
  USERS = 'users',
  CATEGORIES = 'categories',
  ANALYTICS = 'analytics',
  SUBSCRIBERS = 'subscribers',
  LEADS = 'leads',
  CAMPAIGNS = 'campaigns',
  FAQS = 'faqs',
}

export enum PublishStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  FAILED = 'failed',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum SubscriberStatus {
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
}

export enum SubscriberSource {
  NEWSLETTER = 'newsletter',
  CASE_STUDY_DOWNLOAD = 'case_study_download',
  MANUAL = 'manual',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  DISQUALIFIED = 'disqualified',
}

export enum LeadSource {
  CASE_STUDY = 'case_study',
  CONTACT_FORM = 'contact_form',
  DIRECT = 'direct',
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum AnalyticsEvent {
  PAGE_VIEW = 'page_view',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  CLICK = 'click',
}

export enum ContentType {
  BLOG = 'blog',
  CASE_STUDY = 'case-study',
  PROJECT = 'project',
}

export const SEOMetadataSchema = z.object({
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  keywords: z.string().nullish(),
  ogImage: z.string().nullish(),
});

export const PortfolioIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Please select a portfolio');

export const TagSchema = z.object({
  tag: z.string(),
  id: z.string().nullish(),
});

/**
 * Base Schema for common MongoDB fields
 */
export const BaseSchema = z.object({
  _id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const BlogSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string(),
    content: z.string().nullish(),
    excerpt: z.string().nullish(),
    author: z
      .object({
        name: z.string(),
        image: z.string().nullish(),
      })
      .nullish(),
    category: z.string().nullish(),
    tags: z.array(TagSchema).nullish(),
    status: z.enum(PublishStatus).default(PublishStatus.DRAFT),
    publishedAt: z.string().nullish(),
    featured: z.boolean().default(false),
    readTime: z.string().nullish(),
    seo: SEOMetadataSchema.nullish(),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape);

export const CaseStudySchema = z
  .object({
    projectTitle: z.string(),
    slug: z.string(),
    client: z.string().nullish(),
    industry: z.string().nullish(),
    services: z.array(z.string()).default([]),
    year: z.string().nullish(),
    category: z.string().nullish(),
    content: z.string(), // This will now act as the minimalistic "Overview" text
    excerpt: z.string().nullish(),
    readTime: z.string().nullish(), // e.g., "5 min read"
    coverImage: z.string().nullish(), // Hero image for the detail page
    tags: z.array(TagSchema).nullish(),
    status: z.enum(PublishStatus).default(PublishStatus.DRAFT),
    featured: z.boolean().default(false),
    pdfUrl: z.string().nullish(), // The gated content PDF to email
    seo: SEOMetadataSchema.nullish(),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape);

export const ProjectSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string(),
    excerpt: z.string().nullish(),
    techStack: z.array(z.string()).default([]),
    projectType: z.string().nullish(),
    liveUrl: z.string().url().nullish(),
    repoUrl: z.string().url().nullish(),
    thumbnail: z.string().nullish(),
    gallery: z.array(z.string()).default([]),
    status: z.enum(PublishStatus).default(PublishStatus.DRAFT),
    featured: z.boolean().default(false),
    description: z.string().nullish(),
    category: z.string().nullish(),
    seo: SEOMetadataSchema.nullish(),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape);

export enum MediaFolder {
  UNORGANIZED = 'unorganized',
  BRANDING = 'branding',
  CONTENT = 'content',
  PORTFOLIOS = 'portfolios',
  VIDEOS = 'videos',
  DOCUMENTS = 'documents',
}

export const MediaSchema = z
  .object({
    filename: z.string(),
    imageKitUrl: z.string(),
    imageKitFileId: z.string(),
    mimeType: z.string(),
    filesize: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
    altText: z.string().optional(),
    folder: z.enum(MediaFolder).default(MediaFolder.UNORGANIZED),
    tags: z.array(z.string()).default([]),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape);

export const PortfolioSchema = z
  .object({
    name: z.string().min(1, 'Portfolio name is required'),
    domain: z.string().min(1, 'Primary domain is required'),
    active: z.boolean().default(true),
    newsletterConfig: z
      .object({
        senderName: z.string().nullish(),
        senderEmail: z.string().nullish(),
        replyTo: z.string().nullish(),
        accentColor: z.string().nullish(),
        logoUrl: z.string().nullish(),
        footerText: z.string().nullish(),
      })
      .nullish(),
    smtpConfig: z
      .object({
        host: z.string().nullish(),
        port: z.preprocess(
          (val) => (val === '' || isNaN(Number(val)) ? undefined : Number(val)),
          z.number().nullish()
        ),
        user: z.string().nullish(),
        pass: z.string().nullish(),
        secure: z.boolean().default(false),
      })
      .nullish(),
    customScripts: z
      .object({
        head: z.string().nullish(),
        footer: z.string().nullish(),
      })
      .nullish(),
    socialLinks: z
      .array(
        z.object({
          platform: z.string(),
          url: z.string(),
        })
      )
      .default([]),
    maintenanceMode: z.boolean().default(false),
  })
  .extend(BaseSchema.shape);

export const SubscriberSchema = z
  .object({
    email: z.email(),
    portfolio: PortfolioIdSchema,
    status: z.enum(SubscriberStatus).default(SubscriberStatus.ACTIVE),
    source: z.enum(SubscriberSource).default(SubscriberSource.NEWSLETTER),
    subscribedAt: z.string().optional(),
    downloadHistory: z.array(z.string()).default([]),
    intent: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .extend(BaseSchema.shape);

export const LeadSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    company: z.string().nullish(),
    jobTitle: z.string().nullish(),
    phone: z.string().nullish(),
    source: z.enum(LeadSource).default(LeadSource.CASE_STUDY),
    downloadedItems: z.array(z.string()).default([]),
    status: z.enum(LeadStatus).default(LeadStatus.NEW),
    notes: z
      .array(
        z.object({
          content: z.string(),
          adminName: z.string().optional(),
          createdAt: z.string().optional(),
        })
      )
      .default([]),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape);

export const UserSchema = z
  .object({
    email: z.email(),
    role: z.enum(UserRole).default(UserRole.VIEWER),
    portfolios: z.array(z.string()).optional().default([]),
    password: z.string().optional(),
    resetToken: z.string().optional(),
    resetTokenExpiry: z.date().optional(),
  })
  .extend(BaseSchema.shape);

export const CategorySchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    portfolio: PortfolioIdSchema,
    isDefault: z.boolean().optional(),
  })
  .extend(BaseSchema.shape);

export const CampaignSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    subject: z.string().min(1, 'Subject is required'),
    content: z.string().min(1, 'Content is required'),
    portfolio: PortfolioIdSchema,
    status: z.enum(PublishStatus).default(PublishStatus.DRAFT),
    recipientCount: z.number().default(0),
    sentAt: z.string().nullish(),
    stats: z
      .object({
        opens: z.number().default(0),
        clicks: z.number().default(0),
      })
      .nullish(),
  })
  .extend(BaseSchema.shape);

export const AnalyticsSchema = z
  .object({
    portfolio: PortfolioIdSchema,
    event: z.enum(AnalyticsEvent),
    path: z.string(),
    visitorId: z.string(),
    duration: z.number().default(0),
    metadata: z
      .object({
        browser: z.string().optional(),
        os: z.string().optional(),
        device: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
  })
  .extend(BaseSchema.shape);

export const StatsSchema = z.object({
  blogs: z.number(),
  blogsTrend: z.string(),
  projects: z.number(),
  projectsTrend: z.string(),
  media: z.number(),
  mediaTrend: z.string(),
  portfolios: z.number(),
  portfoliosTrend: z.string(),
  categories: z.number().optional(),
  users: z.number().optional(),
  campaigns: z.number().optional(),
  analytics: z.number().optional(),
  breakdown: z
    .array(
      z.object({
        _id: z.string(),
        name: z.string(),
        blogCount: z.number(),
        projectCount: z.number(),
        visitorCount: z.number().optional(),
      })
    )
    .optional(),
  traffic: z
    .object({
      totalSessions: z.number(),
      averageDuration: z.number(),
      bounceRate: z.number(),
    })
    .optional(),
  leadsMonthly: z
    .array(
      z.object({
        month: z.string(),
        count: z.number(),
      })
    )
    .optional(),
  totalVisitors: z.number().optional(),
  totalLeads: z.number().optional(),
  conversionRate: z.number().optional(),
});

export const FaqSchema = z
  .object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
    portfolio: PortfolioIdSchema,
    status: z.enum(PublishStatus).default(PublishStatus.PUBLISHED),
    order: z.number().default(0),
    group: z.string().nullish(),
  })
  .extend(BaseSchema.shape);

// Helper types for TypeScript
export type Blog = z.infer<typeof BlogSchema>;
export type CaseStudy = z.infer<typeof CaseStudySchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type SEOMetadata = z.infer<typeof SEOMetadataSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;
export type User = z.infer<typeof UserSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type Subscriber = z.infer<typeof SubscriberSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type Faq = z.infer<typeof FaqSchema>;
export type Tag = z.infer<typeof TagSchema>;

// Populated Schemas for Listing Views and Responses
export const PopulatedBlogSchema = BlogSchema.extend({
  category: z
    .object({ _id: z.string(), name: z.string(), slug: z.string() })
    .nullish(),
  portfolio: z
    .object({
      _id: z.string(),
      name: z.string(),
      domain: z.string().optional(),
    })
    .nullish(),
});
export type PopulatedBlog = z.infer<typeof PopulatedBlogSchema>;

export const PopulatedCaseStudySchema = CaseStudySchema.extend({
  category: z
    .object({ _id: z.string(), name: z.string(), slug: z.string() })
    .nullish(),
  portfolio: z
    .object({
      _id: z.string(),
      name: z.string(),
      domain: z.string().optional(),
    })
    .nullish(),
});
export type PopulatedCaseStudy = z.infer<typeof PopulatedCaseStudySchema>;

export const PopulatedProjectSchema = ProjectSchema.extend({
  category: z
    .object({ _id: z.string(), name: z.string(), slug: z.string() })
    .nullish(),
  portfolio: z
    .object({
      _id: z.string(),
      name: z.string(),
      domain: z.string().optional(),
    })
    .nullish(),
});
export type PopulatedProject = z.infer<typeof PopulatedProjectSchema>;
