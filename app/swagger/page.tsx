/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect } from 'react';

export default function SwaggerPage() {
  useEffect(() => {
    // Dynamically load Swagger UI
    const loadSwaggerUI = async () => {
      if ((window as any).SwaggerUIBundle) return;
      
      // Load Swagger UI CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css';
      document.head.appendChild(link);

      // Load Swagger UI JS
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
      script.onload = () => {
        (window as any).SwaggerUIBundle({
          url: '/api/swagger',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            (window as any).SwaggerUIBundle.presets.apis,
          ],
          layout: 'BaseLayout',
        });
      };
      document.body.appendChild(script);
    };

    loadSwaggerUI();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div id="swagger-ui"></div>
    </div>
  );
}