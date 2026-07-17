import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PaginationMeta } from '@/types/cms';
import dbConnect, { getDb } from '@/lib/db/dbConnect';
import mongoose from 'mongoose';
import { verifyToken } from './auth-utils';
import { z } from 'zod';
import { User, UserRole } from '@/schemas/cms';
import { CmsPermission, hasPermission } from '@/lib/auth';

/**
 * Type for Next.js Route Handler Context. Every route should destructure
 * `params`/`validatedData` directly off this rather than re-declaring its
 * own local `RouteContext` — a narrower local type breaks under strict
 * function-parameter checking (contravariance).
 */
export interface RouteContext {
  params: Promise<Record<string, string>>;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_auth_token')?.value;

  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    if (!payload) return null;

    const user = await getDb()
      .collection('users')
      .findOne({ _id: new mongoose.Types.ObjectId(payload.userId) });

    if (!user) {
      const cookieStore = await cookies();
      cookieStore.delete('alpha_auth_token');
      return null;
    }
    return user as unknown as User;
  } catch (_) {
    return null;
  }
}

/**
 * Higher-Order Function to wrap API handlers.
 * Handles database connection and global error catching.
 */
export interface ApiHandlerOptions<T extends z.ZodSchema = z.ZodSchema> {
  isPublic?: boolean;
  schema?: T;
  /** Named permission required to call this route (checked once the user is authenticated). */
  permission?: CmsPermission;
}

// NOTE: `validatedData` is typed as optional here because it genuinely is
// `undefined` when no `schema` option is passed. When a route DOES pass
// `{ schema: X }`, validation happens before `handler` runs (a failed parse
// throws and `handler` is never called) — so `validatedData` is guaranteed
// present in that case. Routes that pass a schema can safely assert
// non-null at the point of use (`validatedData!`) rather than re-checking.
export function apiHandler<T extends z.ZodSchema = z.ZodSchema>(
  handler: (
    req: Request,
    context: RouteContext & { validatedData?: z.infer<T> }
  ) => Promise<NextResponse>,
  options: ApiHandlerOptions<T> = {}
) {
  return async (req: Request, context: RouteContext) => {
    try {
      await dbConnect();

      // Validate ID in params if present
      if (context.params) {
        const params = await context.params;
        if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
          return sendNotFound('Resource');
        }
      }

      let validatedData: z.infer<T> | undefined;
      if (
        options.schema &&
        (req.method === 'POST' ||
          req.method === 'PATCH' ||
          req.method === 'PUT')
      ) {
        const body = await req.json();
        validatedData = options.schema.parse(body);
      }

      // Role Protection & Authentication — applies to every method (GET included)
      // unless the route explicitly opts out via { isPublic: true }.
      if (!options.isPublic) {
        const user = await getCurrentUser();

        if (!user) {
          return sendError('AUTHENTICATION REQUIRED', 401);
        }

        // Viewers should never be able to perform mutations (POST, PUT, DELETE)
        if (req.method !== 'GET' && user.role === UserRole.VIEWER) {
          return sendError('VIEWER ROLE - ACCESS DENIED', 403);
        }

        // Named permission check, when the route declares one
        if (options.permission && !hasPermission(user, options.permission)) {
          return sendForbidden(
            'You do not have permission to perform this action'
          );
        }
      }

      return await handler(req, { ...context, validatedData });
    } catch (error) {
      console.error('API_HANDLER_ERROR:', error);

      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'ZodError'
      ) {
        const issues = (error as z.ZodError).issues;
        return sendError(issues.map((e) => e.message).join(', '), 400);
      }
      if (
        error instanceof Error &&
        error.message.includes('input must be a 24 character hex string')
      ) {
        return sendBadRequest('Invalid ID format');
      }

      return sendError('Internal server error', 500);
    }
  };
}

/**
 * Standard envelope for a single resource (GET one, POST create, PATCH update, DELETE).
 */
export function sendData(data: unknown, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Standard envelope for a list of resources (GET many).
 */
export function sendList<T>(
  data: T[],
  options: {
    page?: number;
    limit?: number;
    total?: number;
  } = {}
) {
  const { page = 1, limit = data.length, total = data.length } = options;

  const totalPages = Math.ceil(total / limit) || 1;

  const pagination: PaginationMeta = {
    total,
    limit,
    totalPages,
    page,
    pagingCounter: (page - 1) * limit + 1,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  };

  return NextResponse.json({ data, pagination });
}

/**
 * Validates a raw query-param string against a list of valid enum values.
 * Returns the value if valid, undefined otherwise.
 *
 * Usage:
 *   parseEnumParam(status, Object.values(PublishStatus))
 *   parseEnumParam(source, Object.values(SubscriberSource))
 */
export function parseEnumParam<T extends string>(
  value: string | null | undefined,
  validValues: readonly T[]
): T | undefined {
  if (!value || value === 'all') return undefined;
  return validValues.includes(value as T) ? (value as T) : undefined;
}

/**
 * Parses and normalizes URL query params for CMS list endpoints.
 *
 * Design rules:
 *  - Filter params (status, category, source) return null when absent or 'all'.
 *    The 'all' sentinel is a frontend UI concept — it must not leak into API logic.
 *    Routes simply do: `if (status) { query.status = status; }` — no 'all' check needed.
 *  - Pagination params (page, limit) are clamped and NaN-safe.
 */
export function parseSearchParams(request: Request) {
  const { searchParams } = new URL(request.url);

  // Text search — escape regex special characters to prevent ReDoS
  const rawSearch = searchParams.get('search')?.trim() || '';
  const search = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Filter params — normalize 'all' and empty to null
  const rawStatus = searchParams.get('status');
  const status = rawStatus && rawStatus !== 'all' ? rawStatus : null;

  const rawCategory = searchParams.get('category');
  const category = rawCategory && rawCategory !== 'all' ? rawCategory : null;

  const rawSource = searchParams.get('source');
  const source = rawSource && rawSource !== 'all' ? rawSource : null;

  // Optional scoping params
  const portfolio = searchParams.get('portfolio') || null;
  const folder = searchParams.get('folder') || null;
  const tag = searchParams.get('tag') || null;

  // Pagination — parseInt is NaN-safe via fallback
  const rawPage = parseInt(searchParams.get('page') ?? '');
  const rawLimit = parseInt(searchParams.get('limit') ?? '');
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.max(1, isNaN(rawLimit) ? 10 : rawLimit);
  const skip = (page - 1) * limit;

  return {
    search,
    status,
    category,
    source,
    portfolio,
    folder,
    tag,
    page,
    limit,
    skip,
  };
}

export function sendError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function sendBadRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Returns a standardized 404 Not Found response.
 */
export function sendNotFound(resource: string = 'Resource') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function sendForbidden(message: string = 'Access denied') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * CORS UTILITIES
 * Used for public-facing endpoints (Leads, Subscribers, etc.)
 */
export function sendCorsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  return response;
}

export function corsOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * DATABASE HELPERS (Low-Overhead)
 * These handle the ObjectId conversion and collection access.
 */
export const DbUtils = {
  async createDoc(collection: string, data: Record<string, unknown>) {
    return await getDb().collection(collection).insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async findDoc(
    collection: string,
    id: string,
    scopedQuery?: Record<string, unknown>
  ) {
    const query = scopedQuery || { _id: new mongoose.Types.ObjectId(id) };
    return await getDb().collection(collection).findOne(query);
  },

  async updateDoc(
    collection: string,
    id: string,
    data: Record<string, unknown>,
    scopedQuery?: Record<string, unknown>
  ) {
    // Remove immutable or internal fields that shouldn't be part of the $set operation
    const { _id, id: _discardedId, createdAt, ...updateData } = data;
    const query = scopedQuery || {
      _id: new mongoose.Types.ObjectId(id as string),
    };

    return await getDb()
      .collection(collection)
      .updateOne(query, { $set: { ...updateData, updatedAt: new Date() } });
  },

  async deleteDoc(
    collection: string,
    id: string,
    scopedQuery?: Record<string, unknown>
  ) {
    const query = scopedQuery || {
      _id: new mongoose.Types.ObjectId(id as string),
    };
    return await getDb().collection(collection).deleteOne(query);
  },
};
