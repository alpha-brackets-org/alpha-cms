import {
  Portfolio,
  Blog,
  CaseStudy,
  Project,
  Faq,
  Testimonial,
  Category,
  Lead,
  Subscriber,
  Campaign,
  Media,
  Analytics,
  UserRole,
  SubscriberStatus,
  SubscriberSource,
  LeadStatus,
  LeadSource,
  PublishStatus,
  TestimonialStatus,
  AnalyticsEvent,
  MediaFolder,
} from '@/types/cms';

export interface LeadCapturePayload {
  firstName: string;
  lastName: string;
  email: string;
  portfolio: string;
  caseStudyId: string;
  company?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
}

export const mockPortfolioData: Omit<
  Portfolio,
  '_id' | 'createdAt' | 'updatedAt'
> = {
  name: 'Test Portfolio',
  domain: 'test.com',
  active: true,
  maintenanceMode: false,
  newsletterConfig: {
    senderName: 'Test',
    senderEmail: 'test@test.com',
    replyTo: 'test@test.com',
    accentColor: '#000000',
    logoUrl: null,
    footerText: 'Footer',
  },
  customScripts: { head: '', footer: '' },
  socialLinks: [],
};

export const mockAdminUser = {
  email: 'admin@test.com',
  role: UserRole.ADMIN,
  password: 'admin123',
};

export const mockBlogData = (
  portfolioId: string
): Omit<Blog, '_id' | 'createdAt' | 'updatedAt'> => ({
  title: 'Test Blog',
  slug: 'test-blog',
  portfolio: portfolioId,
  status: PublishStatus.PUBLISHED,
  author: null,
  category: null,
  tags: [],
  featured: false,
  readTime: null,
  publishedAt: null,
  seo: null,
  content: null,
  excerpt: null,
});

export const mockCaseStudyData = (
  portfolioId: string
): Omit<CaseStudy, '_id' | 'createdAt' | 'updatedAt'> => ({
  projectTitle: 'Cool Case Study',
  slug: 'cool-case-study',
  content: 'Details content',
  portfolio: portfolioId,
  status: PublishStatus.PUBLISHED,
  client: null,
  industry: null,
  services: [],
  year: null,
  category: null,
  excerpt: null,
  readTime: null,
  coverImage: null,
  tags: [],
  featured: false,
  pdfUrl: null,
  seo: null,
});

export const mockProjectData = (
  portfolioId: string
): Omit<Project, '_id' | 'createdAt' | 'updatedAt'> => ({
  title: 'Cool Project',
  slug: 'cool-project',
  portfolio: portfolioId,
  status: PublishStatus.PUBLISHED,
  excerpt: null,
  description: null,
  techStack: [],
  projectType: null,
  liveUrl: null,
  repoUrl: null,
  thumbnail: null,
  gallery: [],
  featured: false,
  category: null,
  seo: null,
});

export const mockFaqData = (
  portfolioId: string
): Omit<Faq, '_id' | 'createdAt' | 'updatedAt'> => ({
  question: 'FAQ Question',
  answer: 'FAQ Answer',
  portfolio: portfolioId,
  status: PublishStatus.PUBLISHED,
  order: 0,
  group: null,
});

export const mockTestimonialData = (
  portfolioId: string
): Omit<Testimonial, '_id' | 'createdAt' | 'updatedAt'> => ({
  name: 'John Doe',
  content: 'Great service.',
  portfolio: portfolioId,
  status: TestimonialStatus.PUBLISHED,
  role: null,
  company: null,
  avatar: null,
  rating: 5,
  featured: false,
  order: 0,
  sourceUrl: null,
  platform: null,
});

export const mockCategoryData = (
  portfolioId: string
): Omit<Category, '_id' | 'createdAt' | 'updatedAt'> => ({
  name: 'Tech',
  slug: 'tech',
  portfolio: portfolioId,
  isDefault: false,
});

export const mockLeadData = (
  portfolioId: string
): Omit<Lead, '_id' | 'createdAt' | 'updatedAt'> => ({
  firstName: 'Bob',
  lastName: 'Smith',
  email: 'bob@smith.com',
  portfolio: portfolioId,
  company: null,
  jobTitle: null,
  phone: null,
  source: LeadSource.CASE_STUDY,
  downloadedItems: [],
  status: LeadStatus.NEW,
  notes: [],
});

export const mockLeadCaptureData = (
  portfolioId: string,
  caseStudyId: string
): LeadCapturePayload => ({
  firstName: 'Bob',
  lastName: 'Smith',
  email: 'bob@smith.com',
  portfolio: portfolioId,
  caseStudyId,
  company: null,
  jobTitle: null,
  phone: null,
});

export const mockSubscriberData = (
  portfolioId: string
): Omit<Subscriber, '_id' | 'createdAt' | 'updatedAt'> => ({
  email: 'subscriber@test.com',
  portfolio: portfolioId,
  status: SubscriberStatus.ACTIVE,
  source: SubscriberSource.NEWSLETTER,
  subscribedAt: undefined,
  downloadHistory: [],
  intent: null,
  metadata: null,
});

export const mockCampaignData = (
  portfolioId: string
): Omit<Campaign, '_id' | 'createdAt' | 'updatedAt'> => ({
  title: 'Promo Campaign',
  subject: 'Special offer!',
  content: 'Details about special offer.',
  portfolio: portfolioId,
  status: PublishStatus.DRAFT,
  recipientCount: 0,
  sentAt: null,
  stats: null,
});

export const mockMediaData = (
  portfolioId: string
): Omit<Media, '_id' | 'createdAt' | 'updatedAt'> => ({
  filename: 'test.png',
  imageKitUrl: 'https://ik.imagekit.io/test.png',
  imageKitFileId: 'file_123',
  mimeType: 'image/png',
  filesize: 1024,
  width: 100,
  height: 100,
  folder: MediaFolder.UNORGANIZED,
  tags: ['branding'],
  portfolio: portfolioId,
  altText: '',
});

export const mockAnalyticsData = (
  portfolioId: string
): Omit<Analytics, '_id' | 'createdAt' | 'updatedAt'> => ({
  portfolio: portfolioId,
  event: AnalyticsEvent.PAGE_VIEW,
  path: '/home',
  visitorId: 'visitor_123',
  duration: 5,
  metadata: undefined,
});
