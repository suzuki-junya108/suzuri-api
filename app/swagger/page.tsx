'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI url="/api/swagger" />
    </div>
  );
}