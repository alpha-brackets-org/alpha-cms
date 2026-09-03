'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export function ApiDocsClient() {
  return (
    <div
      style={{ colorScheme: 'light', background: '#fff', minHeight: '100vh' }}
    >
      <SwaggerUI url="/api/openapi.json" />
    </div>
  );
}
