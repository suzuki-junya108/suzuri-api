import { NextRequest, NextResponse } from 'next/server';
import SuzuriClient from '@/lib/suzuri-client';
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

const suzuriClient = new SuzuriClient(
  process.env.SUZURI_API_KEY!
);

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET() {
  try {
    const items = await suzuriClient.getAvailableItems();
    
    // Return simplified item list
    return NextResponse.json({
      items: items.map(item => ({
        id: item.id,
        name: item.humanizeName,
        exemplaryAngle: item.exemplaryAngle,
        published: item.published,
        variantCount: item.variants?.length || 0,
      })),
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available items' },
      { status: 500, headers: corsHeaders() }
    );
  }
}