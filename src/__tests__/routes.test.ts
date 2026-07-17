import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import mongoose from 'mongoose';
import dbConnect, { getDb } from '@/lib/db/dbConnect';
import { signToken } from '@/lib/auth-utils';
import { UserRole, CollectionName } from '@/types/cms';

// Mocks
let mockCookieToken: string | undefined = undefined;

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      if (name === 'alpha_auth_token') {
        return mockCookieToken ? { value: mockCookieToken } : undefined;
      }
      return undefined;
    },
  }),
}));

vi.mock('ioredis', () => {
  return {
    default: class MockRedis {
      on() {}
      async incr() {
        return 1;
      }
      async expire() {}
      async set() {}
      async get() {
        return null;
      }
    },
  };
});

vi.mock('@/lib/email', () => ({
  sendPasswordReset: async () => {},
  sendNewsletterEmail: async () => {},
  sendLeadNotification: async () => {},
  sendCaseStudyEmail: async () => {},
  sendOperatorInvite: async () => {},
}));

vi.mock('@/lib/newsletter-engine', () => ({
  sendCampaignEmail: async () => ({ sent: 1, failed: 0 }),
  sendLeadMagnetEmail: async () => {},
}));

vi.mock('@/lib/imagekit', () => ({
  default: {
    files: {
      upload: async () => ({
        name: 'test.png',
        url: 'https://ik.imagekit.io/test.png',
        fileId: 'file_123',
        fileType: 'image/png',
        size: 1024,
        width: 100,
        height: 100,
      }),
      deleteFile: async () => {},
      delete: async () => {},
      bulk: {
        delete: async () => {},
      },
    },
    helper: {
      getAuthenticationParameters: () => ({
        token: 'test_token',
        expire: 1234567,
        signature: 'test_signature',
      }),
    },
  },
  toFile: async (buf: Buffer, name: string) => ({ buffer: buf, name }),
  getSignedUrl: (url: string) => url,
}));

// Helpers & Data
import {
  makeReq,
  clearCollections,
  seedDefaultPortfolio,
  seedUser,
} from './test-helpers';
import {
  mockAdminUser,
  mockBlogData,
  mockCaseStudyData,
  mockProjectData,
  mockFaqData,
  mockTestimonialData,
  mockCategoryData,
  mockLeadData,
  mockLeadCaptureData,
  mockCampaignData,
  mockMediaData,
  mockAnalyticsData,
} from './test-data';

// Route imports
import { GET as getStats } from '@/app/api/stats/route';
import { GET as getBlogs, POST as postBlog } from '@/app/api/blogs/route';
import {
  GET as getBlog,
  PATCH as patchBlog,
  DELETE as deleteBlog,
} from '@/app/api/blogs/[id]/route';
import {
  GET as getCaseStudies,
  POST as postCaseStudy,
} from '@/app/api/case-studies/route';
import {
  GET as getCaseStudy,
  PATCH as patchCaseStudy,
  DELETE as deleteCaseStudy,
} from '@/app/api/case-studies/[id]/route';
import {
  GET as getProjects,
  POST as postProject,
} from '@/app/api/projects/route';
import {
  GET as getProject,
  PATCH as patchProject,
  DELETE as deleteProject,
} from '@/app/api/projects/[id]/route';
import { GET as getFaqs, POST as postFaq } from '@/app/api/faqs/route';
import {
  GET as getFaq,
  PATCH as patchFaq,
  DELETE as deleteFaq,
} from '@/app/api/faqs/[id]/route';
import {
  GET as getTestimonials,
  POST as postTestimonial,
} from '@/app/api/testimonials/route';
import {
  GET as getTestimonial,
  PATCH as patchTestimonial,
  DELETE as deleteTestimonial,
} from '@/app/api/testimonials/[id]/route';
import {
  GET as getCategories,
  POST as postCategory,
} from '@/app/api/categories/route';
import {
  PATCH as patchCategory,
  DELETE as deleteCategory,
} from '@/app/api/categories/[id]/route';
import {
  GET as getPortfolios,
  POST as postPortfolio,
} from '@/app/api/portfolios/route';
import {
  GET as getPortfolio,
  PATCH as patchPortfolio,
  DELETE as deletePortfolio,
} from '@/app/api/portfolios/[id]/route';
import { GET as getPortfolioConfig } from '@/app/api/portfolios/config/route';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';
import { GET as authMe } from '@/app/api/auth/me/route';
import { POST as changePassword } from '@/app/api/auth/change-password/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as captureLead } from '@/app/api/leads/capture/route';
import { GET as getLeads, POST as postLead } from '@/app/api/leads/route';
import {
  GET as getLead,
  PATCH as patchLead,
  DELETE as deleteLead,
} from '@/app/api/leads/[id]/route';
import { GET as exportLeads } from '@/app/api/leads/export/route';
import { GET as getSubscribers } from '@/app/api/subscribers/route';
import {
  PATCH as patchSubscriber,
  DELETE as deleteSubscriber,
} from '@/app/api/subscribers/[id]/route';
import { POST as unsubscribeSubscriber } from '@/app/api/subscribers/unsubscribe/route';
import { POST as collectAnalytics } from '@/app/api/analytics/collect/route';
import {
  GET as getCampaigns,
  POST as postCampaign,
} from '@/app/api/campaigns/route';
import {
  GET as getCampaign,
  DELETE as deleteCampaign,
} from '@/app/api/campaigns/[id]/route';
import { POST as sendCampaign } from '@/app/api/campaigns/[id]/send/route';
import {
  GET as getMedia,
  POST as postMedia,
  DELETE as bulkDeleteMedia,
} from '@/app/api/media/route';
import {
  PATCH as patchMedia,
  DELETE as deleteMedia,
} from '@/app/api/media/[id]/route';
import { GET as getMediaAuth } from '@/app/api/media/auth/route';
import { POST as uploadMediaProxy } from '@/app/api/media/upload/route';
import { POST as submitPortfolioLead } from '@/app/api/portfolios/[id]/leads/route';
import { POST as subscribePortfolio } from '@/app/api/portfolios/[id]/subscribe/route';
import { GET as getOpenApiSpec } from '@/app/api/openapi.json/route';
import { GET as getUsers, POST as postUser } from '@/app/api/users/route';
import {
  PATCH as patchUser,
  DELETE as deleteUser,
} from '@/app/api/users/[id]/route';

describe('CMS Endpoint Integration Tests', () => {
  let testPortfolioIdStr: string;
  let testAdminToken: string;
  let testAdminIdStr: string;

  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearCollections(getDb());
    testPortfolioIdStr = await seedDefaultPortfolio(getDb());
    testAdminIdStr = await seedUser(
      getDb(),
      mockAdminUser.email,
      mockAdminUser.password,
      mockAdminUser.role,
      [testPortfolioIdStr]
    );
    testAdminToken = await signToken({
      userId: testAdminIdStr,
      email: mockAdminUser.email,
      role: mockAdminUser.role,
    });
    mockCookieToken = undefined; // start unauthenticated
  });

  describe('OpenAPI Spec Endpoint', () => {
    it('GET /api/openapi.json returns the correct spec json', async () => {
      const res = await getOpenApiSpec();
      expect(res.status).toBe(200);
      const spec = await res.json();
      expect(spec.openapi).toBeDefined();
      expect(spec.paths).toBeDefined();
    });
  });

  describe('Users Endpoint Group', () => {
    it('GET /api/users requires admin role', async () => {
      // Unauthenticated — apiHandler's auth gate rejects before the route's own role check runs
      const unauthRes = await getUsers(makeReq('http://localhost/api/users'), {
        params: Promise.resolve({}),
      });
      expect(unauthRes.status).toBe(401);

      // Authenticated as Admin
      mockCookieToken = testAdminToken;
      const adminRes = await getUsers(makeReq('http://localhost/api/users'), {
        params: Promise.resolve({}),
      });
      expect(adminRes.status).toBe(200);
      const usersList = (await adminRes.json()).data;
      expect(usersList).toBeInstanceOf(Array);
      expect(usersList.length).toBe(1);
      expect(usersList[0].email).toBe(mockAdminUser.email);
    });

    it('POST /api/users, PATCH /api/users/[id], and DELETE /api/users/[id] work correctly', async () => {
      mockCookieToken = testAdminToken;

      // 1. Create a new operator
      const postRes = await postUser(
        makeReq('http://localhost/api/users', 'POST', {
          email: 'editor@test.com',
          role: UserRole.EDITOR,
          portfolios: [testPortfolioIdStr],
        }),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      const newUserIdStr = postData.data._id.toString();

      // Prevent duplicate registration
      const conflictRes = await postUser(
        makeReq('http://localhost/api/users', 'POST', {
          email: 'editor@test.com',
          role: UserRole.EDITOR,
        }),
        { params: Promise.resolve({}) }
      );
      expect(conflictRes.status).toBe(409);

      // 2. PATCH operator details
      const patchRes = await patchUser(
        makeReq(`http://localhost/api/users/${newUserIdStr}`, 'PATCH', {
          email: 'updated-editor@test.com',
        }),
        { params: Promise.resolve({ id: newUserIdStr }) }
      );
      expect(patchRes.status).toBe(200);

      // Test collision check by attempting to change admin's email to the editor's email
      const collisionRes = await patchUser(
        makeReq(`http://localhost/api/users/${testAdminIdStr}`, 'PATCH', {
          email: 'updated-editor@test.com',
        }),
        { params: Promise.resolve({ id: testAdminIdStr }) }
      );
      expect(collisionRes.status).toBe(409);

      // 3. DELETE operator
      const deleteRes = await deleteUser(
        makeReq(`http://localhost/api/users/${newUserIdStr}`, 'DELETE'),
        { params: Promise.resolve({ id: newUserIdStr }) }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Stats Endpoint Group', () => {
    it('GET /api/stats works', async () => {
      mockCookieToken = testAdminToken;
      const res = await getStats(
        makeReq('http://localhost/api/stats?months=6'),
        { params: Promise.resolve({}) }
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.blogs).toBeDefined();
    });
  });

  describe('Blogs Endpoint Group', () => {
    it('GET /api/blogs and mutations work correctly', async () => {
      // GET — list routes require authentication like every other admin resource
      mockCookieToken = testAdminToken;
      const getRes = await getBlogs(makeReq('http://localhost/api/blogs'), {
        params: Promise.resolve({}),
      });
      expect(getRes.status).toBe(200);
      const getResData = await getRes.json();
      expect(getResData.data).toBeInstanceOf(Array);

      // POST
      const postRes = await postBlog(
        makeReq(
          'http://localhost/api/blogs',
          'POST',
          mockBlogData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      const blogId = postData.data._id;

      // GET single
      const getSingleRes = await getBlog(
        makeReq(`http://localhost/api/blogs/${blogId}`),
        {
          params: Promise.resolve({ id: blogId }),
        }
      );
      expect(getSingleRes.status).toBe(200);

      // PATCH
      const patchRes = await patchBlog(
        makeReq(`http://localhost/api/blogs/${blogId}`, 'PATCH', {
          title: 'Updated Title',
        }),
        { params: Promise.resolve({ id: blogId }) }
      );
      expect(patchRes.status).toBe(200);

      // DELETE
      const deleteRes = await deleteBlog(
        makeReq(`http://localhost/api/blogs/${blogId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: blogId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });

    it('handles pagination and filtering parameters correctly', async () => {
      mockCookieToken = testAdminToken;

      // 1. Create a category
      const categoryResult = await getDb()
        .collection(CollectionName.CATEGORIES)
        .insertOne({
          name: 'Tech',
          slug: 'tech',
          portfolio: new mongoose.Types.ObjectId(testPortfolioIdStr),
        });
      const techCatIdStr = categoryResult.insertedId.toString();

      // 2. Seed 3 blogs with different data
      await getDb().collection(CollectionName.BLOGS).insertMany([
        {
          title: 'First Blog Post',
          slug: 'first-blog-post',
          portfolio: new mongoose.Types.ObjectId(testPortfolioIdStr),
          status: 'draft',
          category: new mongoose.Types.ObjectId(techCatIdStr),
          createdAt: new Date(Date.now() - 10000),
        },
        {
          title: 'Second Article',
          slug: 'second-article',
          portfolio: new mongoose.Types.ObjectId(testPortfolioIdStr),
          status: 'published',
          category: null,
          createdAt: new Date(Date.now() - 5000),
        },
        {
          title: 'Third Blog Entry',
          slug: 'third-blog-entry',
          portfolio: new mongoose.Types.ObjectId(testPortfolioIdStr),
          status: 'published',
          category: new mongoose.Types.ObjectId(techCatIdStr),
          createdAt: new Date(),
        },
      ]);

      // Test Limit & Page Pagination
      const page1Res = await getBlogs(
        makeReq(`http://localhost/api/blogs?limit=2&page=1`),
        { params: Promise.resolve({}) }
      );
      expect(page1Res.status).toBe(200);
      const page1Data = await page1Res.json();
      expect(page1Data.data.length).toBe(2);
      expect(page1Data.pagination.total).toBe(3);
      expect(page1Data.pagination.totalPages).toBe(2);

      const page2Res = await getBlogs(
        makeReq(`http://localhost/api/blogs?limit=2&page=2`),
        { params: Promise.resolve({}) }
      );
      expect(page2Res.status).toBe(200);
      const page2Data = await page2Res.json();
      expect(page2Data.data.length).toBe(1);

      // Test Search Filter
      const searchRes = await getBlogs(
        makeReq(`http://localhost/api/blogs?search=Article`),
        { params: Promise.resolve({}) }
      );
      expect(searchRes.status).toBe(200);
      const searchData = await searchRes.json();
      expect(searchData.data.length).toBe(1);
      expect(searchData.data[0].title).toBe('Second Article');

      // Test Status Filter
      const statusRes = await getBlogs(
        makeReq(`http://localhost/api/blogs?status=draft`),
        { params: Promise.resolve({}) }
      );
      expect(statusRes.status).toBe(200);
      const statusData = await statusRes.json();
      expect(statusData.data.length).toBe(1);
      expect(statusData.data[0].title).toBe('First Blog Post');

      // Test Category ID Filter
      const catRes = await getBlogs(
        makeReq(`http://localhost/api/blogs?category=${techCatIdStr}`),
        { params: Promise.resolve({}) }
      );
      expect(catRes.status).toBe(200);
      const catData = await catRes.json();
      expect(catData.data.length).toBe(2);

      // Test Uncategorized Default Filter
      const uncategorizedRes = await getBlogs(
        makeReq(`http://localhost/api/blogs?category=default-uncategorized`),
        { params: Promise.resolve({}) }
      );
      expect(uncategorizedRes.status).toBe(200);
      const uncategorizedData = await uncategorizedRes.json();
      expect(uncategorizedData.data.length).toBe(1);
      expect(uncategorizedData.data[0].title).toBe('Second Article');
    });
  });

  describe('Case Studies Endpoint Group', () => {
    it('GET, POST, PATCH, and DELETE work correctly', async () => {
      mockCookieToken = testAdminToken;
      const postRes = await postCaseStudy(
        makeReq(
          'http://localhost/api/case-studies',
          'POST',
          mockCaseStudyData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      const caseStudyId = postData.data._id;

      const getRes = await getCaseStudies(
        makeReq('http://localhost/api/case-studies'),
        { params: Promise.resolve({}) }
      );
      expect(getRes.status).toBe(200);

      const getSingleRes = await getCaseStudy(
        makeReq(`http://localhost/api/case-studies/${caseStudyId}`),
        {
          params: Promise.resolve({ id: caseStudyId }),
        }
      );
      expect(getSingleRes.status).toBe(200);

      const patchRes = await patchCaseStudy(
        makeReq(`http://localhost/api/case-studies/${caseStudyId}`, 'PATCH', {
          projectTitle: 'New Title',
        }),
        { params: Promise.resolve({ id: caseStudyId }) }
      );
      expect(patchRes.status).toBe(200);

      const deleteRes = await deleteCaseStudy(
        makeReq(`http://localhost/api/case-studies/${caseStudyId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: caseStudyId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Projects Endpoint Group', () => {
    it('POST, PATCH, and DELETE work correctly', async () => {
      mockCookieToken = testAdminToken;
      const postRes = await postProject(
        makeReq(
          'http://localhost/api/projects',
          'POST',
          mockProjectData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      const projectId = postData.data._id;

      const getRes = await getProjects(
        makeReq('http://localhost/api/projects'),
        { params: Promise.resolve({}) }
      );
      expect(getRes.status).toBe(200);

      const getSingleRes = await getProject(
        makeReq(`http://localhost/api/projects/${projectId}`),
        {
          params: Promise.resolve({ id: projectId }),
        }
      );
      expect(getSingleRes.status).toBe(200);

      const patchRes = await patchProject(
        makeReq(`http://localhost/api/projects/${projectId}`, 'PATCH', {
          title: 'Updated Project',
        }),
        { params: Promise.resolve({ id: projectId }) }
      );
      expect(patchRes.status).toBe(200);

      const deleteRes = await deleteProject(
        makeReq(`http://localhost/api/projects/${projectId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: projectId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('FAQs Endpoint Group', () => {
    it('POST, GET, PATCH, and DELETE work correctly', async () => {
      mockCookieToken = testAdminToken;
      const postRes = await postFaq(
        makeReq(
          'http://localhost/api/faqs',
          'POST',
          mockFaqData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      const faqId = postData.data._id;

      const getRes = await getFaqs(makeReq('http://localhost/api/faqs'), {
        params: Promise.resolve({}),
      });
      expect(getRes.status).toBe(200);

      const getSingleRes = await getFaq(
        makeReq(`http://localhost/api/faqs/${faqId}`),
        {
          params: Promise.resolve({ id: faqId }),
        }
      );
      expect(getSingleRes.status).toBe(200);

      const patchRes = await patchFaq(
        makeReq(`http://localhost/api/faqs/${faqId}`, 'PATCH', {
          question: 'New FAQ Question',
        }),
        { params: Promise.resolve({ id: faqId }) }
      );
      expect(patchRes.status).toBe(200);

      const deleteRes = await deleteFaq(
        makeReq(`http://localhost/api/faqs/${faqId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: faqId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Testimonials Endpoint Group', () => {
    it('POST, GET, PATCH, and DELETE work correctly', async () => {
      mockCookieToken = testAdminToken;
      const postRes = await postTestimonial(
        makeReq(
          'http://localhost/api/testimonials',
          'POST',
          mockTestimonialData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      const testId = postData.data._id;

      const getRes = await getTestimonials(
        makeReq('http://localhost/api/testimonials'),
        { params: Promise.resolve({}) }
      );
      expect(getRes.status).toBe(200);

      const getSingleRes = await getTestimonial(
        makeReq(`http://localhost/api/testimonials/${testId}`),
        {
          params: Promise.resolve({ id: testId }),
        }
      );
      expect(getSingleRes.status).toBe(200);

      const patchRes = await patchTestimonial(
        makeReq(`http://localhost/api/testimonials/${testId}`, 'PATCH', {
          name: 'John Doe Updated',
        }),
        { params: Promise.resolve({ id: testId }) }
      );
      expect(patchRes.status).toBe(200);

      const deleteRes = await deleteTestimonial(
        makeReq(`http://localhost/api/testimonials/${testId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: testId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Categories Endpoint Group', () => {
    it('POST, GET, PATCH, and DELETE work correctly', async () => {
      mockCookieToken = testAdminToken;
      const postRes = await postCategory(
        makeReq(
          'http://localhost/api/categories',
          'POST',
          mockCategoryData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      const catId = postData.data._id;

      const getRes = await getCategories(
        makeReq('http://localhost/api/categories'),
        { params: Promise.resolve({}) }
      );
      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.data.length).toBe(2); // uncategorized default + our Tech category

      const patchRes = await patchCategory(
        makeReq(`http://localhost/api/categories/${catId}`, 'PATCH', {
          name: 'Technology',
        }),
        { params: Promise.resolve({ id: catId }) }
      );
      expect(patchRes.status).toBe(200);

      const deleteRes = await deleteCategory(
        makeReq(`http://localhost/api/categories/${catId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: catId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Portfolios Endpoint Group', () => {
    it('POST, GET, GET single, Config, and mutations work correctly', async () => {
      mockCookieToken = testAdminToken;

      // POST
      const postRes = await postPortfolio(
        makeReq('http://localhost/api/portfolios', 'POST', {
          name: 'Portfolioweb',
          domain: 'pweb.com',
        }),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);

      // GET List
      const getRes = await getPortfolios(
        makeReq('http://localhost/api/portfolios'),
        { params: Promise.resolve({}) }
      );
      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.data.length).toBe(2);

      // GET Single
      const getSingleRes = await getPortfolio(
        makeReq(`http://localhost/api/portfolios/${testPortfolioIdStr}`),
        {
          params: Promise.resolve({ id: testPortfolioIdStr }),
        }
      );
      expect(getSingleRes.status).toBe(200);

      // PATCH
      const patchRes = await patchPortfolio(
        makeReq(
          `http://localhost/api/portfolios/${testPortfolioIdStr}`,
          'PATCH',
          { name: 'Renamed Portfolio' }
        ),
        { params: Promise.resolve({ id: testPortfolioIdStr }) }
      );
      expect(patchRes.status).toBe(200);

      // GET Config
      const configRes = await getPortfolioConfig(
        makeReq(`http://localhost/api/portfolios/config?domain=test.com`),
        { params: Promise.resolve({}) }
      );
      expect(configRes.status).toBe(200);

      // DELETE
      const deleteRes = await deletePortfolio(
        makeReq(
          `http://localhost/api/portfolios/${testPortfolioIdStr}`,
          'DELETE'
        ),
        {
          params: Promise.resolve({ id: testPortfolioIdStr }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Authentication Endpoint Group', () => {
    it('POST /api/auth/login, me, logout, password flow works', async () => {
      // Login
      const loginRes = await login(
        makeReq('http://localhost/api/auth/login', 'POST', {
          email: mockAdminUser.email,
          password: mockAdminUser.password,
        }),
        { params: Promise.resolve({}) }
      );
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.data.user).toBeDefined();
      expect(loginData.data.user.email).toBe(mockAdminUser.email);

      // Me
      mockCookieToken = testAdminToken;
      const meRes = await authMe(makeReq('http://localhost/api/auth/me'), {
        params: Promise.resolve({}),
      });
      expect(meRes.status).toBe(200);
      const meData = await meRes.json();
      expect(meData.data).toBeDefined();
      expect(meData.data.email).toBe(mockAdminUser.email);

      // Change Password
      const changePasswordRes = await changePassword(
        makeReq('http://localhost/api/auth/change-password', 'POST', {
          currentPassword: mockAdminUser.password,
          newPassword: 'newAdminPassword123',
        }),
        { params: Promise.resolve({}) }
      );
      expect(changePasswordRes.status).toBe(200);

      // Forgot password (Public)
      const forgotPasswordRes = await forgotPassword(
        makeReq('http://localhost/api/auth/forgot-password', 'POST', {
          email: mockAdminUser.email,
        }),
        { params: Promise.resolve({}) }
      );
      expect(forgotPasswordRes.status).toBe(200);

      // Fetch user resetToken from DB
      const user = await getDb()
        .collection('users')
        .findOne({ email: mockAdminUser.email });
      expect(user?.resetToken).toBeDefined();

      // Reset password (Public)
      const resetPasswordRes = await resetPassword(
        makeReq('http://localhost/api/auth/reset-password', 'POST', {
          token: user?.resetToken,
          password: 'resettedPassword123',
        }),
        { params: Promise.resolve({}) }
      );
      expect(resetPasswordRes.status).toBe(200);

      // Logout
      const logoutRes = await logout(
        makeReq('http://localhost/api/auth/logout', 'POST'),
        { params: Promise.resolve({}) }
      );
      expect(logoutRes.status).toBe(200);
    });
  });

  describe('Leads Endpoint Group', () => {
    it('POST /api/leads/capture, POST /api/leads, export, and mutations work', async () => {
      // Seed a case study so we have a valid caseStudyId for capture
      const csResult = await getDb()
        .collection(CollectionName.CASE_STUDIES)
        .insertOne({
          projectTitle: 'Seeded Case Study',
          slug: 'seeded-case-study',
          content: 'Content',
          portfolio: new mongoose.Types.ObjectId(testPortfolioIdStr),
        });
      const testCaseStudyIdStr = csResult.insertedId.toString();

      // capture (Public)
      const captureRes = await captureLead(
        makeReq(
          'http://localhost/api/leads/capture',
          'POST',
          mockLeadCaptureData(testPortfolioIdStr, testCaseStudyIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(captureRes.status).toBe(201);

      // POST /api/leads (Admin/Authenticated)
      mockCookieToken = testAdminToken;
      const postRes = await postLead(
        makeReq(
          'http://localhost/api/leads',
          'POST',
          mockLeadData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postLeadData = await postRes.json();
      const leadId = postLeadData.data._id;

      // GET leads
      const getRes = await getLeads(makeReq('http://localhost/api/leads'), {
        params: Promise.resolve({}),
      });
      expect(getRes.status).toBe(200);

      // GET single lead
      const getSingleRes = await getLead(
        makeReq(`http://localhost/api/leads/${leadId}`),
        {
          params: Promise.resolve({ id: leadId }),
        }
      );
      expect(getSingleRes.status).toBe(200);

      // PATCH lead
      const patchRes = await patchLead(
        makeReq(`http://localhost/api/leads/${leadId}`, 'PATCH', {
          firstName: 'Robert',
        }),
        { params: Promise.resolve({ id: leadId }) }
      );
      expect(patchRes.status).toBe(200);

      // Export Leads
      const exportRes = await exportLeads(
        makeReq('http://localhost/api/leads/export'),
        { params: Promise.resolve({}) }
      );
      expect(exportRes.status).toBe(200);

      // DELETE lead
      const deleteRes = await deleteLead(
        makeReq(`http://localhost/api/leads/${leadId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: leadId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Subscribers Endpoint Group', () => {
    it('mutations, unsubscribe, GET /api/subscribers work correctly', async () => {
      // Seed a subscriber directly
      const subResult = await getDb()
        .collection(CollectionName.SUBSCRIBERS)
        .insertOne({
          email: 'subscriber@test.com',
          portfolio: new mongoose.Types.ObjectId(testPortfolioIdStr),
          status: 'active',
        });
      const subId = subResult.insertedId.toString();

      // GET list
      mockCookieToken = testAdminToken;
      const getRes = await getSubscribers(
        makeReq('http://localhost/api/subscribers'),
        { params: Promise.resolve({}) }
      );
      expect(getRes.status).toBe(200);

      // PATCH
      const patchRes = await patchSubscriber(
        makeReq(`http://localhost/api/subscribers/${subId}`, 'PATCH', {
          status: 'unsubscribed',
        }),
        { params: Promise.resolve({ id: subId }) }
      );
      expect(patchRes.status).toBe(200);

      // Unsubscribe (Public)
      const unsubRes = await unsubscribeSubscriber(
        makeReq('http://localhost/api/subscribers/unsubscribe', 'POST', {
          email: 'subscriber@test.com',
          portfolioId: testPortfolioIdStr,
        }),
        { params: Promise.resolve({}) }
      );
      expect(unsubRes.status).toBe(200);

      // DELETE
      const deleteRes = await deleteSubscriber(
        makeReq(`http://localhost/api/subscribers/${subId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: subId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Campaigns Endpoint Group', () => {
    it('POST, GET, send, and DELETE campaigns work correctly', async () => {
      mockCookieToken = testAdminToken;
      // Seed a subscriber to prevent sendCampaign failing due to empty subscribers
      await getDb()
        .collection(CollectionName.SUBSCRIBERS)
        .insertOne({
          email: 'sub1@campaign.com',
          portfolio: new mongoose.Types.ObjectId(testPortfolioIdStr),
          status: 'active',
        });

      const postRes = await postCampaign(
        makeReq(
          'http://localhost/api/campaigns',
          'POST',
          mockCampaignData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      const campaignId = postData.data._id;

      const getRes = await getCampaigns(
        makeReq('http://localhost/api/campaigns'),
        { params: Promise.resolve({}) }
      );
      expect(getRes.status).toBe(200);

      const getSingleRes = await getCampaign(
        makeReq(`http://localhost/api/campaigns/${campaignId}`),
        {
          params: Promise.resolve({ id: campaignId }),
        }
      );
      expect(getSingleRes.status).toBe(200);

      // Trigger Send Campaign
      const sendRes = await sendCampaign(
        makeReq(`http://localhost/api/campaigns/${campaignId}/send`, 'POST'),
        {
          params: Promise.resolve({ id: campaignId }),
        }
      );
      expect(sendRes.status).toBe(200);

      const deleteRes = await deleteCampaign(
        makeReq(`http://localhost/api/campaigns/${campaignId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: campaignId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Media Endpoint Group', () => {
    it('GET /api/media, POST metadata, PATCH single, bulk DELETE, upload, and delete work correctly', async () => {
      mockCookieToken = testAdminToken;

      // Media Auth
      const authRes = await getMediaAuth(
        makeReq('http://localhost/api/media/auth'),
        { params: Promise.resolve({}) }
      );
      expect(authRes.status).toBe(200);

      // Upload Media Proxy
      const formData = new FormData();
      const mockFile = new Blob(['PNG_DATA'], { type: 'image/png' });
      formData.append('file', mockFile, 'image.png');
      formData.append('portfolio', testPortfolioIdStr);
      formData.append('fileName', 'image.png');
      formData.append('virtualFolder', 'branding');
      formData.append('folder', '/branding');

      const uploadReq = new Request('http://localhost/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadRes = await uploadMediaProxy(uploadReq, {
        params: Promise.resolve({}),
      });
      expect(uploadRes.status).toBe(201);
      const uploadedMediaId = (await uploadRes.json()).data._id;

      // POST /api/media (creates metadata)
      const postRes = await postMedia(
        makeReq(
          'http://localhost/api/media',
          'POST',
          mockMediaData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(postRes.status).toBe(201);
      const postMediaData = await postRes.json();
      const postedMediaId = postMediaData.data._id;

      // PATCH /api/media/[id]
      const patchRes = await patchMedia(
        makeReq(`http://localhost/api/media/${postedMediaId}`, 'PATCH', {
          altText: 'Stunning Image',
        }),
        { params: Promise.resolve({ id: postedMediaId }) }
      );
      expect(patchRes.status).toBe(200);

      // GET Media
      const getRes = await getMedia(makeReq('http://localhost/api/media'), {
        params: Promise.resolve({}),
      });
      expect(getRes.status).toBe(200);

      // Bulk DELETE /api/media
      const bulkDeleteRes = await bulkDeleteMedia(
        makeReq('http://localhost/api/media', 'DELETE', {
          ids: [postedMediaId],
        }),
        { params: Promise.resolve({}) }
      );
      expect(bulkDeleteRes.status).toBe(200);

      // DELETE Single Media (uploaded one)
      const deleteRes = await deleteMedia(
        makeReq(`http://localhost/api/media/${uploadedMediaId}`, 'DELETE'),
        {
          params: Promise.resolve({ id: uploadedMediaId }),
        }
      );
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Analytics Endpoint Group', () => {
    it('POST /api/analytics/collect works', async () => {
      const res = await collectAnalytics(
        makeReq(
          'http://localhost/api/analytics/collect',
          'POST',
          mockAnalyticsData(testPortfolioIdStr)
        ),
        { params: Promise.resolve({}) }
      );
      expect(res.status).toBe(201);
    });
  });

  describe('Public Portfolio Lead and Newsletter subscriptions', () => {
    it('captures leads and newsletter subscriptions for a portfolio', async () => {
      // Seed a case study so we have a valid caseStudyId for capture
      const csResult = await getDb()
        .collection(CollectionName.CASE_STUDIES)
        .insertOne({
          projectTitle: 'Public Seeded Case Study',
          slug: 'public-seeded-case-study',
          content: 'Content',
          portfolio: new mongoose.Types.ObjectId(testPortfolioIdStr),
        });
      const testCaseStudyIdStr = csResult.insertedId.toString();

      // Submit portfolio lead
      const leadRes = await submitPortfolioLead(
        makeReq(
          `http://localhost/api/portfolios/${testPortfolioIdStr}/leads`,
          'POST',
          mockLeadCaptureData(testPortfolioIdStr, testCaseStudyIdStr)
        ),
        { params: Promise.resolve({ id: testPortfolioIdStr }) }
      );
      expect(leadRes.status).toBe(201);

      // Subscribe to portfolio newsletter
      const subRes = await subscribePortfolio(
        makeReq(
          `http://localhost/api/portfolios/${testPortfolioIdStr}/subscribe`,
          'POST',
          {
            email: 'newsletter-subscriber@test.com',
          }
        ),
        { params: Promise.resolve({ id: testPortfolioIdStr }) }
      );
      expect(subRes.status).toBe(201);
    });
  });
});
