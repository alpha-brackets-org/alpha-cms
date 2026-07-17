import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { parseSearchParams, apiHandler } from '@/lib/api-utils';
import { z } from 'zod';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import dbConnect, { getDb } from '@/lib/db/dbConnect';
import { UserRole } from '@/schemas/cms';

// Mock cookies for getCurrentUser inside apiHandler tests
let mockCookieToken: string | undefined = undefined;
let mockUserRecord: Record<string, unknown> | null = null;

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      if (name === 'alpha_auth_token') {
        return mockCookieToken ? { value: mockCookieToken } : undefined;
      }
      return undefined;
    },
    delete: () => {},
  }),
}));

// Mock verifyToken
vi.mock('@/lib/auth-utils', () => ({
  verifyToken: async (token: string) => {
    if (token === 'valid_token') {
      return {
        userId: '6a1ed4e9bb6ec19dd0361d5a',
        email: 'test@test.com',
        role: 'admin',
      };
    }
    return null;
  },
}));

describe('parseSearchParams', () => {
  function makeRequest(query: string) {
    return new Request(`http://localhost/api/blogs?${query}`);
  }

  it('parses page and limit correctly', () => {
    const result = parseSearchParams(makeRequest('page=2&limit=20'));
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(20);
  });

  it('clamps page to 1 minimum', () => {
    const result = parseSearchParams(makeRequest('page=-5'));
    expect(result.page).toBe(1);
  });

  it('normalises "all" status to null', () => {
    const result = parseSearchParams(makeRequest('status=all'));
    expect(result.status).toBeNull();
  });

  it('passes a valid status through', () => {
    const result = parseSearchParams(makeRequest('status=published'));
    expect(result.status).toBe('published');
  });

  it('escapes regex special characters in search to prevent ReDoS', () => {
    const result = parseSearchParams(makeRequest('search=a%2Bb%2Bc%2B'));
    expect(result.search).toContain('\\+');
  });

  it('escapes dots in search', () => {
    const result = parseSearchParams(makeRequest('search=file.txt'));
    expect(result.search).toBe('file\\.txt');
  });

  it('returns empty search for missing param', () => {
    const result = parseSearchParams(makeRequest(''));
    expect(result.search).toBe('');
  });
});

describe('apiHandler Wrapper', () => {
  beforeAll(async () => {
    await dbConnect();
    // Spy on user findOne in tests
    vi.spyOn(getDb(), 'collection').mockImplementation(
      (name: string) => {
        if (name === 'users') {
          return {
            findOne: async () => mockUserRecord,
          } as unknown as ReturnType<ReturnType<typeof getDb>['collection']>;
        }
        return {
          countDocuments: async () => 0,
        } as unknown as ReturnType<ReturnType<typeof getDb>['collection']>;
      }
    );
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('handles successful handler executions', async () => {
    const handler = apiHandler(
      async () => {
        return NextResponse.json({ ok: true });
      },
      { isPublic: true }
    );

    const req = new Request('http://localhost/api/test');
    const res = await handler(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('returns 500 when handler throws an error', async () => {
    // Hide expected console.error output during test execution
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = apiHandler(
      async () => {
        throw new Error('Database connection failed unexpectedly');
      },
      { isPublic: true }
    );

    const req = new Request('http://localhost/api/test');
    const res = await handler(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(500);
    const body = await res.json();
    // Internal error details are never leaked to the client — only logged server-side.
    expect(body.error).toBe('Internal server error');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('returns 400 when schema validation fails on POST requests', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const schema = z.object({
      email: z.string().email(),
    });

    const handler = apiHandler(
      async () => {
        return NextResponse.json({ success: true });
      },
      { isPublic: true, schema }
    );

    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await handler(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid email');

    consoleSpy.mockRestore();
  });

  it('returns 401 when mutation is attempted without authentication', async () => {
    mockCookieToken = undefined;

    const handler = apiHandler(async () => {
      return NextResponse.json({ success: true });
    });

    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await handler(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when mutation is attempted by a viewer user role', async () => {
    mockCookieToken = 'valid_token';
    mockUserRecord = {
      _id: new mongoose.Types.ObjectId('6a1ed4e9bb6ec19dd0361d5a'),
      email: 'viewer@test.com',
      role: UserRole.VIEWER,
    };

    const handler = apiHandler(async () => {
      return NextResponse.json({ success: true });
    });

    const req = new Request('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await handler(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('VIEWER ROLE - ACCESS DENIED');
  });
});
