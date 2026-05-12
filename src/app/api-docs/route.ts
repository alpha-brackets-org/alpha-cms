import { ApiReference } from '@scalar/nextjs-api-reference';
import { getOpenApiSpec } from '@/lib/swagger';

export const GET = ApiReference({
  spec: {
    content: getOpenApiSpec(),
  },
  theme: 'bluePlanet',
  layout: 'modern',
  darkMode: true,
});
