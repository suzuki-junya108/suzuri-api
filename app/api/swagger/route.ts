import { NextRequest, NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';
import { corsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET() {
  const spec = getApiDocs();
  return NextResponse.json(spec, { headers: corsHeaders() });
}