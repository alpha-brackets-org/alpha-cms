import { describe, it, expect } from 'vitest';
import { parseSearchParams } from '@/lib/api-utils';

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
    // The + signs should be escaped so they can't be used as regex quantifiers
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
