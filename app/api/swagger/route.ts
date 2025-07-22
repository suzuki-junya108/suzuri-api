import { NextRequest, NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';
import { corsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  const spec = getApiDocs();
  
  // Get the origin from the request to use the current domain
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  
  // Override the servers configuration with the current origin
  spec.servers = [
    {
      url: origin,
      description: 'Current server',
    }
  ];
  
  return NextResponse.json(spec, { headers: corsHeaders() });
}