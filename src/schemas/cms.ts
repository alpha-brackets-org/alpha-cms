import { z } from '@/lib/zod-setup';

// =============================================================================
// SECTION 1 — COLLECTION NAMES (MongoDB registry)
// =============================================================================

export enum CollectionName {
  ANALYTICS = 'analytics',
  BLOGS = 'blogs',
  CAMPAIGNS = 'campaigns',
  CASE_STUDIES = 'case-studies',
  CATEGORIES = 'categories',
  FAQS = 'faqs',
  LEADS = 'leads',
  MEDIA = 'media',
  PORTFOLIOS = 'portfolios',
  PROJECTS = 'projects',
  SUBSCRIBERS = 'subscribers',
  TESTIMONIALS = 'testimonials',
  USERS = 'users',
}

// =============================================================================
// SECTION 2 — ENUMS
// =============================================================================

export enum PublishStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum TestimonialStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

export enum MediaFolder {
  UNORGANIZED = 'unorganized',
  BRANDING = 'branding',
  CONTENT = 'content',
  PORTFOLIOS = 'portfolios',
  VIDEOS = 'videos',
  DOCUMENTS = 'documents',
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

// =============================================================================
// SECTION 3 — SHARED / PRIMITIVE SCHEMAS
// =============================================================================

/** Reusable MongoDB _id validator */
export const PortfolioIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Please select a portfolio');

/** Common MongoDB document timestamps + _id */
export const BaseSchema = z.object({
  _id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/** Shared portfolio reference shape used in all Populated* schemas */
const PopulatedPortfolioRef = z
  .object({
    _id: z.string(),
    name: z.string(),
    domain: z.string().optional(),
  })
  .nullish();

/** Shared category reference shape */
const PopulatedCategoryRef = z
  .object({ _id: z.string(), name: z.string(), slug: z.string() })
  .nullish();

export const SEOMetadataSchema = z.object({
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  keywords: z.string().nullish(),
  ogImage: z.string().nullish(),
});

export const TagSchema = z.object({
  tag: z.string(),
  id: z.string().nullish(),
});

// Zod schemas for enums to generate clean, referenced OpenAPI definitions
export const PublishStatusSchema = z
  .enum(PublishStatus)
  .openapi('PublishStatus');
export const TestimonialStatusSchema = z
  .enum(TestimonialStatus)
  .openapi('TestimonialStatus');
export const MediaFolderSchema = z.enum(MediaFolder).openapi('MediaFolder');
export const SubscriberStatusSchema = z
  .enum(SubscriberStatus)
  .openapi('SubscriberStatus');
export const SubscriberSourceSchema = z
  .enum(SubscriberSource)
  .openapi('SubscriberSource');
export const LeadStatusSchema = z.enum(LeadStatus).openapi('LeadStatus');
export const LeadSourceSchema = z.enum(LeadSource).openapi('LeadSource');
export const UserRoleSchema = z.enum(UserRole).openapi('UserRole');
export const AnalyticsEventSchema = z
  .enum(AnalyticsEvent)
  .openapi('AnalyticsEvent');
export const ContentTypeSchema = z.enum(ContentType).openapi('ContentType');

// =============================================================================
// SECTION 4 — CONTENT SCHEMAS (Blog, CaseStudy, Project, FAQ, Testimonial)
// =============================================================================

export const BlogSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
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
    status: PublishStatusSchema.default(PublishStatus.DRAFT),
    publishedAt: z.string().nullish(),
    featured: z.boolean().default(false),
    readTime: z.string().nullish(),
    seo: SEOMetadataSchema.nullish(),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape)
  .openapi('Blog');

export const CaseStudySchema = z
  .object({
    projectTitle: z.string(),
    slug: z.string(),
    client: z.string().nullish(),
    industry: z.string().nullish(),
    services: z.array(z.string()).default([]),
    year: z.string().nullish(),
    category: z.string().nullish(),
    content: z.string(), // Minimalistic "Overview" teaser shown on listing page
    excerpt: z.string().nullish(),
    readTime: z.string().nullish(),
    coverImage: z.string().nullish(),
    tags: z.array(TagSchema).nullish(),
    status: PublishStatusSchema.default(PublishStatus.DRAFT),
    featured: z.boolean().default(false),
    pdfUrl: z.string().nullish(), // Gated content PDF sent to lead on download
    seo: SEOMetadataSchema.nullish(),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape)
  .openapi('CaseStudy');

export const ProjectSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string(),
    excerpt: z.string().nullish(),
    description: z.string().nullish(),
    techStack: z.array(z.string()).default([]),
    projectType: z.string().nullish(),
    liveUrl: z.string().url().nullish(),
    repoUrl: z.string().url().nullish(),
    thumbnail: z.string().nullish(),
    gallery: z.array(z.string()).default([]),
    status: PublishStatusSchema.default(PublishStatus.DRAFT),
    featured: z.boolean().default(false),
    category: z.string().nullish(),
    seo: SEOMetadataSchema.nullish(),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape)
  .openapi('Project');

export const FaqSchema = z
  .object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
    portfolio: PortfolioIdSchema,
    status: PublishStatusSchema.default(PublishStatus.PUBLISHED),
    order: z.number().default(0),
    group: z.string().nullish(),
  })
  .extend(BaseSchema.shape)
  .openapi('Faq');

export const TestimonialSchema = z
  .object({
    name: z.string().min(1, 'Client name is required'),
    role: z.string().nullish(),
    company: z.string().nullish(),
    avatar: z.string().nullish(),
    content: z.string().min(1, 'Testimonial content is required'),
    rating: z.number().int().min(1).max(5).default(5),
    status: TestimonialStatusSchema.default(TestimonialStatus.PUBLISHED),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    sourceUrl: z.string().nullish(),
    platform: z.string().nullish(),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape)
  .openapi('Testimonial');

// =============================================================================
// SECTION 5 — INFRASTRUCTURE SCHEMAS (Portfolio, Media, User, Category)
// =============================================================================

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
      .array(z.object({ platform: z.string(), url: z.string() }))
      .default([]),
    maintenanceMode: z.boolean().default(false),
  })
  .extend(BaseSchema.shape)
  .openapi('Portfolio');

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
    folder: MediaFolderSchema.default(MediaFolder.UNORGANIZED),
    tags: z.array(z.string()).default([]),
    portfolio: PortfolioIdSchema,
  })
  .extend(BaseSchema.shape)
  .openapi('Media');

export const UserSchema = z
  .object({
    email: z.email(),
    role: UserRoleSchema.default(UserRole.VIEWER),
    portfolios: z.array(z.string()).optional().default([]),
    password: z.string().optional(),
    resetToken: z.string().optional(),
    resetTokenExpiry: z.date().optional(),
  })
  .extend(BaseSchema.shape)
  .openapi('User');

export const CategorySchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    portfolio: PortfolioIdSchema,
    isDefault: z.boolean().optional(),
  })
  .extend(BaseSchema.shape)
  .openapi('Category');

// =============================================================================
// SECTION 6 — CRM / MARKETING SCHEMAS (Lead, Subscriber, Campaign, Analytics)
// =============================================================================

export const LeadSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    company: z.string().nullish(),
    jobTitle: z.string().nullish(),
    phone: z.string().nullish(),
    source: LeadSourceSchema.default(LeadSource.CASE_STUDY),
    downloadedItems: z.array(z.string()).default([]),
    status: LeadStatusSchema.default(LeadStatus.NEW),
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
  .extend(BaseSchema.shape)
  .openapi('Lead');

/** Public case-study lead-magnet capture (leads/capture, portfolios/[id]/leads). */
export const LeadCaptureSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    company: z.string().nullish(),
    jobTitle: z.string().nullish(),
    phone: z.string().nullish(),
    portfolio: PortfolioIdSchema,
    caseStudyId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid case study reference'),
    intent: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .openapi('LeadCapture');

/** Public general contact-form lead (portfolios/[id]/leads). */
export const ContactFormLeadSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    company: z.string().nullish(),
    jobTitle: z.string().nullish(),
    phone: z.string().nullish(),
    message: z.string().nullish(),
  })
  .openapi('ContactFormLead');

export const SubscriberSchema = z
  .object({
    email: z.email(),
    portfolio: PortfolioIdSchema,
    status: SubscriberStatusSchema.default(SubscriberStatus.ACTIVE),
    source: SubscriberSourceSchema.default(SubscriberSource.NEWSLETTER),
    subscribedAt: z.string().optional(),
    downloadHistory: z.array(z.string()).default([]),
    intent: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .extend(BaseSchema.shape)
  .openapi('Subscriber');

export const CampaignSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    subject: z.string().min(1, 'Subject is required'),
    content: z.string().min(1, 'Content is required'),
    portfolio: PortfolioIdSchema,
    status: PublishStatusSchema.default(PublishStatus.DRAFT),
    recipientCount: z.number().default(0),
    sentAt: z.string().nullish(),
    stats: z
      .object({
        opens: z.number().default(0),
        clicks: z.number().default(0),
      })
      .nullish(),
  })
  .extend(BaseSchema.shape)
  .openapi('Campaign');

export const AnalyticsSchema = z
  .object({
    portfolio: PortfolioIdSchema,
    event: AnalyticsEventSchema,
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
  .extend(BaseSchema.shape)
  .openapi('Analytics');

export const StatsSchema = z
  .object({
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
      .array(z.object({ month: z.string(), count: z.number() }))
      .optional(),
    totalVisitors: z.number().optional(),
    totalLeads: z.number().optional(),
    conversionRate: z.number().optional(),
  })
  .openapi('Stats');

// =============================================================================
// SECTION 7 — INFERRED TYPESCRIPT TYPES
// =============================================================================

export type SEOMetadata = z.infer<typeof SEOMetadataSchema>;
export type Tag = z.infer<typeof TagSchema>;

// Content
export type Blog = z.infer<typeof BlogSchema>;
export type CaseStudy = z.infer<typeof CaseStudySchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Faq = z.infer<typeof FaqSchema>;
export type Testimonial = z.infer<typeof TestimonialSchema>;

// Infrastructure
export type Portfolio = z.infer<typeof PortfolioSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type User = z.infer<typeof UserSchema>;
export type Category = z.infer<typeof CategorySchema>;

// CRM / Marketing
export type Lead = z.infer<typeof LeadSchema>;
export type Subscriber = z.infer<typeof SubscriberSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type Analytics = z.infer<typeof AnalyticsSchema>;
export type Stats = z.infer<typeof StatsSchema>;

// =============================================================================
// SECTION 8 — POPULATED SCHEMAS (with resolved references for list views)
// =============================================================================

export const PopulatedBlogSchema = BlogSchema.extend({
  category: PopulatedCategoryRef,
  portfolio: PopulatedPortfolioRef,
}).openapi('PopulatedBlog');
export type PopulatedBlog = z.infer<typeof PopulatedBlogSchema>;

export const PopulatedCaseStudySchema = CaseStudySchema.extend({
  category: PopulatedCategoryRef,
  portfolio: PopulatedPortfolioRef,
}).openapi('PopulatedCaseStudy');
export type PopulatedCaseStudy = z.infer<typeof PopulatedCaseStudySchema>;

export const PopulatedProjectSchema = ProjectSchema.extend({
  category: PopulatedCategoryRef,
  portfolio: PopulatedPortfolioRef,
}).openapi('PopulatedProject');
export type PopulatedProject = z.infer<typeof PopulatedProjectSchema>;

export const PopulatedTestimonialSchema = TestimonialSchema.extend({
  portfolio: PopulatedPortfolioRef,
}).openapi('PopulatedTestimonial');
export type PopulatedTestimonial = z.infer<typeof PopulatedTestimonialSchema>;

// =============================================================================
// SECTION 9 — RESPONSE ENVELOPE (mirrors sendData/sendList in src/lib/api-utils.ts)
// =============================================================================

/** Matches PaginationMeta in src/types/cms.ts — kept as the one shared definition. */
export const PaginationMetaSchema = z
  .object({
    total: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    page: z.number(),
    pagingCounter: z.number(),
    hasPrevPage: z.boolean(),
    hasNextPage: z.boolean(),
  })
  .openapi('PaginationMeta');

/**
 * Documents a single-resource response: `{ data: T }`.
 * Use in swagger.ts wherever a route returns `sendData(doc)`.
 */
export function dataResponse<T extends z.ZodTypeAny>(schema: T) {
  return z.object({ data: schema });
}

/**
 * Documents a list response: `{ data: T[], pagination: PaginationMeta }`.
 * Use in swagger.ts wherever a route returns `sendList(items, {...})`.
 */
export function listResponse<T extends z.ZodTypeAny>(schema: T) {
  return z.object({ data: z.array(schema), pagination: PaginationMetaSchema });
}
