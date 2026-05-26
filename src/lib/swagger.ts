import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import { z } from '@/lib/zod-setup';
import {
  BlogSchema,
  CaseStudySchema,
  ProjectSchema,
  MediaSchema,
  SEOMetadataSchema,
  UserSchema,
  CategorySchema,
  StatsSchema,
  SubscriberSchema,
  LeadSchema,
  PortfolioSchema,
  CampaignSchema,
  FaqSchema,
  TestimonialSchema,
  AnalyticsSchema,
  PopulatedBlogSchema,
  PopulatedCaseStudySchema,
  PopulatedProjectSchema,
  PopulatedTestimonialSchema,
} from '@/schemas/cms';
import {
  PublishStatus,
  SubscriberSource,
  SubscriberStatus,
  TestimonialStatus,
} from '@/schemas/cms';

const registry = new OpenAPIRegistry();

/**
 * --- MODEL REGISTRY ---
 * Standardized data structures for the ecosystem
 */
registry.register('Blog', BlogSchema);
registry.register('PopulatedBlog', PopulatedBlogSchema);
registry.register('CaseStudy', CaseStudySchema);
registry.register('PopulatedCaseStudy', PopulatedCaseStudySchema);
registry.register('Project', ProjectSchema);
registry.register('PopulatedProject', PopulatedProjectSchema);
registry.register('Media', MediaSchema);
registry.register('Portfolio', PortfolioSchema);
registry.register('User', UserSchema);
registry.register('Category', CategorySchema);
registry.register('Subscriber', SubscriberSchema);
registry.register('Lead', LeadSchema);
registry.register('Campaign', CampaignSchema);
registry.register('Faq', FaqSchema);
registry.register('Testimonial', TestimonialSchema);
registry.register('PopulatedTestimonial', PopulatedTestimonialSchema);
registry.register('Analytics', AnalyticsSchema);
registry.register('SystemStats', StatsSchema);
registry.register('SEOMetadata', SEOMetadataSchema);

/**
 * Public-safe portfolio config — returned by /portfolios/config.
 * Does NOT expose smtpConfig, credentials, or internal fields.
 */
const PortfolioConfigSchema = z.object({
  _id: z.string(),
  name: z.string(),
  domain: z.string(),
  active: z.boolean(),
  maintenanceMode: z.boolean(),
  newsletterConfig: z.object({
    accentColor: z.string(),
    logoUrl: z.string().nullable(),
    senderName: z.string(),
    footerText: z.string(),
  }),
  customScripts: z.object({ head: z.string(), footer: z.string() }),
  socialLinks: z.array(z.object({ platform: z.string(), url: z.string() })),
});
registry.register('PortfolioConfig', PortfolioConfigSchema);

registry.registerComponent('securitySchemes', 'AuthCookie', {
  type: 'apiKey',
  in: 'cookie',
  name: 'alpha_auth_token',
  description: 'Secure session token for administrative access',
});

/**
 * --- SHARED PARAMETERS ---
 */
const PaginationQueryParams = {
  page: z
    .string()
    .optional()
    .openapi({
      param: { name: 'page', in: 'query' },
      example: '1',
      description: 'Page number',
    }),
  limit: z
    .string()
    .optional()
    .openapi({
      param: { name: 'limit', in: 'query' },
      example: '10',
      description: 'Items per page',
    }),
};

const PortfolioQueryParam = {
  portfolio: z
    .string()
    .optional()
    .openapi({
      param: { name: 'portfolio', in: 'query' },
      description: 'Filter by Portfolio ID for data isolation',
    }),
};

const SearchQueryParam = {
  search: z
    .string()
    .optional()
    .openapi({
      param: { name: 'search', in: 'query' },
      description: 'Global text search (Titles, Slugs, Excerpts)',
    }),
};

const CategoryQueryParam = {
  category: z
    .string()
    .optional()
    .openapi({
      param: { name: 'category', in: 'query' },
      description: 'Filter by Category ID or "default-uncategorized"',
    }),
};

/**
 * --- PRIORITY 1: SYSTEM & MANAGEMENT ---
 */

registry.registerPath({
  method: 'get',
  path: '/stats',
  tags: ['System & Management'],
  description: 'Global system overview and asset counts across all portfolios',
  summary: 'System Health Overview',
  responses: {
    200: {
      description: 'Live system metrics',
      content: { 'application/json': { schema: StatsSchema } },
    },
  },
});

// Portfolios
registry.registerPath({
  method: 'get',
  path: '/portfolios',
  tags: ['System & Management'],
  description: 'List all active portfolios and their configurations',
  summary: 'List Portfolios',
  responses: {
    200: {
      description: 'List of portfolios',
      content: { 'application/json': { schema: z.array(PortfolioSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/portfolios',
  tags: ['System & Management'],
  summary: 'Create Portfolio',
  request: {
    body: { content: { 'application/json': { schema: PortfolioSchema } } },
  },
  responses: { 201: { description: 'Created' } },
});

registry.registerPath({
  method: 'patch',
  path: '/portfolios/{id}',
  tags: ['System & Management'],
  summary: 'Update Portfolio',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: PortfolioSchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'delete',
  path: '/portfolios/{id}',
  tags: ['System & Management'],
  summary: 'Delete Portfolio',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

registry.registerPath({
  method: 'get',
  path: '/portfolios/config',
  tags: ['Public Endpoints'],
  description:
    'Public endpoint to fetch portfolio configuration for external sites',
  summary: 'Get Public Portfolio Config',
  request: {
    query: z.object({
      id: z.string().optional(),
      domain: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Public configuration data',
      content: {
        'application/json': {
          schema: PortfolioConfigSchema,
        },
      },
    },
  },
});

// Users
registry.registerPath({
  method: 'get',
  path: '/users',
  tags: ['System & Management'],
  description: 'List authorized personnel with administrative access',
  summary: 'List Users',
  responses: {
    200: {
      description: 'List of administrative users',
      content: { 'application/json': { schema: z.array(UserSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/users',
  tags: ['System & Management'],
  summary: 'Authorize New User',
  request: {
    body: { content: { 'application/json': { schema: UserSchema } } },
  },
  responses: { 201: { description: 'Authorized' } },
});

registry.registerPath({
  method: 'patch',
  path: '/users/{id}',
  tags: ['System & Management'],
  summary: 'Update User Credentials',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: UserSchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'delete',
  path: '/users/{id}',
  tags: ['System & Management'],
  summary: 'Delete User',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

// Authentication
registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Authentication'],
  description: 'Authenticate user and set secure cookie',
  summary: 'User Login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully authenticated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            user: z.object({
              _id: z.string(),
              email: z.string(),
              role: z.string(),
            }),
          }),
        },
      },
    },
    401: { description: 'Invalid credentials' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/forgot-password',
  tags: ['Authentication'],
  description: 'Request password reset link',
  summary: 'Forgot Password',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Reset link sent if email exists',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/reset-password',
  tags: ['Authentication'],
  description: 'Reset password using token',
  summary: 'Reset Password',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password restored successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    400: { description: 'Invalid token or missing fields' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Authentication'],
  description: 'Get current logged in user session',
  summary: 'Current User Session',
  responses: {
    200: {
      description: 'Current user data or null',
      content: {
        'application/json': {
          schema: z.object({
            user: z
              .object({
                _id: z.string(),
                email: z.string(),
                role: z.string(),
                portfolios: z.array(z.string()),
              })
              .nullable(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/change-password',
  tags: ['Authentication'],
  description: 'Change password for logged in user',
  summary: 'Change Password',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            currentPassword: z.string(),
            newPassword: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    400: { description: 'Incorrect current password or missing fields' },
    401: { description: 'Unauthorized' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Authentication'],
  description: 'Clear authentication cookie and terminate session',
  summary: 'User Logout',
  responses: {
    200: {
      description: 'Successfully logged out',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
  },
});

/**
 * --- PRIORITY 2: LEADS & NEWSLETTER ---
 */

registry.registerPath({
  method: 'post',
  path: '/portfolios/{id}/leads',
  tags: ['Leads & Newsletter'],
  description: 'Submit gated content lead. Triggers automated delivery.',
  summary: 'Gated Content Lead',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Portfolio ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: LeadSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Lead registered and email sent',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            downloadUrl: z.string().openapi({
              description: 'Direct link to the requested case study',
              example: 'https://saadqadir.com/case-study/healthline-platform',
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/portfolios/{id}/subscribe',
  tags: ['Leads & Newsletter'],
  description: 'Subscribe to a specific portfolio newsletter',
  summary: 'Newsletter Opt-in',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Portfolio ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.email(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Subscription confirmed',
      content: {
        'application/json': { schema: z.object({ success: z.boolean() }) },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/subscribers/unsubscribe',
  tags: ['Public Endpoints'],
  description: 'Public endpoint to unsubscribe from a portfolio newsletter',
  summary: 'Newsletter Unsubscribe',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            portfolioId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully unsubscribed',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean(), message: z.string() }),
        },
      },
    },
    404: { description: 'Subscriber not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/analytics/collect',
  tags: ['Public Endpoints'],
  description: 'Submit an analytics event from a portfolio site',
  summary: 'Collect Analytics Event',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AnalyticsSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Event tracked successfully',
      content: {
        'application/json': {
          schema: z.object({
            tracked: z.boolean(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/subscribers',
  tags: ['Leads & Newsletter'],
  description: 'Retrieve paginated list of subscribers across portfolios',
  summary: 'Subscriber Directory',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
      ...SearchQueryParam,
      source: z
        .nativeEnum(SubscriberSource)
        .optional()
        .openapi({ param: { name: 'source', in: 'query' } }),
      status: z
        .nativeEnum(SubscriberStatus)
        .optional()
        .openapi({ param: { name: 'status', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'Paginated subscribers',
      content: { 'application/json': { schema: z.array(SubscriberSchema) } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/subscribers/{id}',
  tags: ['Leads & Newsletter'],
  summary: 'Update Subscriber',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: SubscriberSchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'delete',
  path: '/subscribers/{id}',
  tags: ['Leads & Newsletter'],
  summary: 'Delete Subscriber',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

registry.registerPath({
  method: 'get',
  path: '/leads',
  tags: ['Leads & Newsletter'],
  description: 'Retrieve paginated list of B2B Leads',
  summary: 'Leads Directory',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
      ...SearchQueryParam,
    }),
  },
  responses: {
    200: {
      description: 'Paginated leads',
      content: { 'application/json': { schema: z.array(LeadSchema) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/leads/export',
  tags: ['Leads & Newsletter'],
  description: 'Export leads as CSV file',
  summary: 'Export Leads',
  request: {
    query: z.object({
      ...PortfolioQueryParam,
    }),
  },
  responses: {
    200: {
      description: 'CSV file download',
      content: {
        'text/csv': {
          schema: z.string(),
        },
      },
    },
    404: { description: 'No leads found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/leads/{id}',
  tags: ['Leads & Newsletter'],
  summary: 'Get Single Lead',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'The lead document',
      content: { 'application/json': { schema: LeadSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/leads/{id}',
  tags: ['Leads & Newsletter'],
  summary: 'Update Lead Status/Notes',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: LeadSchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'delete',
  path: '/leads/{id}',
  tags: ['Leads & Newsletter'],
  summary: 'Delete Lead',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

registry.registerPath({
  method: 'get',
  path: '/campaigns',
  tags: ['Leads & Newsletter'],
  summary: 'List Campaigns',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
    }),
  },
  responses: {
    200: {
      description: 'List of newsletter campaigns',
      content: { 'application/json': { schema: z.array(CampaignSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/campaigns',
  tags: ['Leads & Newsletter'],
  summary: 'Create Campaign',
  request: {
    body: { content: { 'application/json': { schema: CampaignSchema } } },
  },
  responses: { 201: { description: 'Created' } },
});

registry.registerPath({
  method: 'get',
  path: '/campaigns/{id}',
  tags: ['Leads & Newsletter'],
  summary: 'Get Single Campaign',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'The campaign document',
      content: { 'application/json': { schema: CampaignSchema } },
    },
    404: { description: 'Campaign not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/campaigns/{id}',
  tags: ['Leads & Newsletter'],
  summary: 'Delete Campaign',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

/**
 * --- PRIORITY 3: CORE CONTENT ---
 */

// Blogs
registry.registerPath({
  method: 'get',
  path: '/blogs',
  tags: ['Core Content'],
  description: 'Retrieve blog posts with multi-portfolio filtering',
  summary: 'List Blogs',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
      ...SearchQueryParam,
      ...CategoryQueryParam,
      status: z
        .enum(PublishStatus)
        .optional()
        .openapi({ param: { name: 'status', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'Paginated blog posts',
      content: { 'application/json': { schema: z.array(PopulatedBlogSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/blogs',
  tags: ['Core Content'],
  summary: 'Create Blog Post',
  request: {
    body: { content: { 'application/json': { schema: BlogSchema } } },
  },
  responses: { 201: { description: 'Created' } },
});

registry.registerPath({
  method: 'patch',
  path: '/blogs/{id}',
  tags: ['Core Content'],
  summary: 'Update Blog Post',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: BlogSchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'get',
  path: '/blogs/{id}',
  tags: ['Core Content'],
  summary: 'Get Single Blog Post',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'The blog post document',
      content: { 'application/json': { schema: PopulatedBlogSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/blogs/{id}',
  tags: ['Core Content'],
  summary: 'Delete Blog Post',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

// Case Studies
registry.registerPath({
  method: 'get',
  path: '/case-studies',
  tags: ['Core Content'],
  description: 'Retrieve project case studies filtered by portfolio',
  summary: 'List Case Studies',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
      ...SearchQueryParam,
      ...CategoryQueryParam,
      status: z
        .enum(PublishStatus)
        .optional()
        .openapi({ param: { name: 'status', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'List of case studies',
      content: { 'application/json': { schema: z.array(PopulatedCaseStudySchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/case-studies',
  tags: ['Core Content'],
  summary: 'Create Case Study',
  request: {
    body: { content: { 'application/json': { schema: CaseStudySchema } } },
  },
  responses: { 201: { description: 'Created' } },
});

registry.registerPath({
  method: 'patch',
  path: '/case-studies/{id}',
  tags: ['Core Content'],
  summary: 'Update Case Study',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CaseStudySchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'get',
  path: '/case-studies/{id}',
  tags: ['Core Content'],
  summary: 'Get Single Case Study',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'The case study document',
      content: { 'application/json': { schema: PopulatedCaseStudySchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/case-studies/{id}',
  tags: ['Core Content'],
  summary: 'Delete Case Study',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

// Projects
registry.registerPath({
  method: 'get',
  path: '/projects',
  tags: ['Core Content'],
  description: 'Retrieve technical projects filtered by portfolio',
  summary: 'List Projects',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
      ...SearchQueryParam,
      status: z
        .enum(PublishStatus)
        .optional()
        .openapi({ param: { name: 'status', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'List of projects',
      content: { 'application/json': { schema: z.array(PopulatedProjectSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/projects',
  tags: ['Core Content'],
  summary: 'Create Project',
  request: {
    body: { content: { 'application/json': { schema: ProjectSchema } } },
  },
  responses: { 201: { description: 'Created' } },
});

registry.registerPath({
  method: 'patch',
  path: '/projects/{id}',
  tags: ['Core Content'],
  summary: 'Update Project',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: ProjectSchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'get',
  path: '/projects/{id}',
  tags: ['Core Content'],
  summary: 'Get Single Project',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'The project document',
      content: { 'application/json': { schema: PopulatedProjectSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/projects/{id}',
  tags: ['Core Content'],
  summary: 'Delete Project',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

// FAQs
registry.registerPath({
  method: 'get',
  path: '/faqs',
  tags: ['Core Content'],
  description: 'Retrieve FAQs with multi-portfolio filtering',
  summary: 'List FAQs',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
      ...SearchQueryParam,
      status: z
        .enum(PublishStatus)
        .optional()
        .openapi({ param: { name: 'status', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'Paginated FAQs',
      content: { 'application/json': { schema: z.array(FaqSchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/faqs',
  tags: ['Core Content'],
  summary: 'Create FAQ',
  request: {
    body: { content: { 'application/json': { schema: FaqSchema } } },
  },
  responses: { 201: { description: 'Created' } },
});

registry.registerPath({
  method: 'get',
  path: '/faqs/{id}',
  tags: ['Core Content'],
  summary: 'Get Single FAQ',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'The FAQ document',
      content: { 'application/json': { schema: FaqSchema } },
    },
    404: { description: 'FAQ not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/faqs/{id}',
  tags: ['Core Content'],
  summary: 'Update FAQ',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: FaqSchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'delete',
  path: '/faqs/{id}',
  tags: ['Core Content'],
  summary: 'Delete FAQ',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

// Testimonials
registry.registerPath({
  method: 'get',
  path: '/testimonials',
  tags: ['Core Content'],
  description: 'Retrieve testimonials with multi-portfolio filtering',
  summary: 'List Testimonials',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
      ...SearchQueryParam,
      status: z
        .nativeEnum(TestimonialStatus)
        .optional()
        .openapi({ param: { name: 'status', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'Paginated testimonials',
      content: {
        'application/json': {
          schema: z.array(PopulatedTestimonialSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/testimonials',
  tags: ['Core Content'],
  summary: 'Create Testimonial',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TestimonialSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/testimonials/{id}',
  tags: ['Core Content'],
  summary: 'Get Single Testimonial',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'The testimonial document',
      content: {
        'application/json': {
          schema: PopulatedTestimonialSchema,
        },
      },
    },
    404: {
      description: 'Testimonial not found',
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/testimonials/{id}',
  tags: ['Core Content'],
  summary: 'Update Testimonial',
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: TestimonialSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    404: {
      description: 'Testimonial not found',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/testimonials/{id}',
  tags: ['Core Content'],
  summary: 'Delete Testimonial',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Deleted',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    404: {
      description: 'Testimonial not found',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/media/auth',
  tags: ['Media & Assets'],
  description:
    'Generate authentication parameters for client-side ImageKit uploads',
  summary: 'ImageKit Auth Params',
  responses: {
    200: {
      description: 'Authentication parameters',
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
            expire: z.number(),
            signature: z.string(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/media/upload',
  tags: ['Media & Assets'],
  summary: 'Upload & Register Media',
  description:
    'Industrial proxy for ImageKit uploads with automatic DB registration',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.unknown().openapi({ type: 'string', format: 'binary' }),
            portfolio: z.string(),
            virtualFolder: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: { 201: { description: 'Uploaded' } },
});

registry.registerPath({
  method: 'patch',
  path: '/media/{id}',
  tags: ['Media & Assets'],
  summary: 'Update Media Metadata',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: MediaSchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'delete',
  path: '/media/{id}',
  tags: ['Media & Assets'],
  summary: 'Delete Media Asset',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

/**
 * --- PRIORITY 4: MEDIA & ASSETS ---
 */

registry.registerPath({
  method: 'get',
  path: '/categories',
  tags: ['Taxonomy & Tags'],
  description: 'Manage categories and tagging structures',
  summary: 'List Categories',
  request: {
    query: z.object({
      ...PortfolioQueryParam,
      ...SearchQueryParam,
    }),
  },
  responses: {
    200: {
      description: 'List of categories',
      content: { 'application/json': { schema: z.array(CategorySchema) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/categories',
  tags: ['Taxonomy & Tags'],
  summary: 'Create Category',
  request: {
    body: { content: { 'application/json': { schema: CategorySchema } } },
  },
  responses: { 201: { description: 'Created' } },
});

registry.registerPath({
  method: 'patch',
  path: '/categories/{id}',
  tags: ['Taxonomy & Tags'],
  summary: 'Update Category',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: CategorySchema } } },
  },
  responses: { 200: { description: 'Updated' } },
});

registry.registerPath({
  method: 'delete',
  path: '/categories/{id}',
  tags: ['Taxonomy & Tags'],
  summary: 'Delete Category',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: { 200: { description: 'Deleted' } },
});

registry.registerPath({
  method: 'get',
  path: '/media',
  tags: ['Media & Assets'],
  description: 'Retrieve and filter centralized media assets',
  summary: 'List Media Library',
  request: {
    query: z.object({
      ...PaginationQueryParams,
      ...PortfolioQueryParam,
      ...SearchQueryParam,
      mimeType: z
        .string()
        .optional()
        .openapi({ param: { name: 'mimeType', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'List of media files',
      content: { 'application/json': { schema: z.array(MediaSchema) } },
    },
  },
});

export function getOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.4.0',
      title: 'ALPHA CMS API',
      description:
        'The unified interface for managing multiple agency portfolios. Organized by system criticality and asset type.',
    },
    servers: [{ url: '/api' }],
    security: [{ AuthCookie: [] }],
  });
}
