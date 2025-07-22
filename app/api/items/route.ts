import { NextRequest, NextResponse } from 'next/server';
import SuzuriClient from '@/lib/suzuri-client';

export const runtime = 'nodejs';

const suzuriClient = new SuzuriClient(
  process.env.SUZURI_API_KEY!
);

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
    });
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available items' },
      { status: 500 }
    );
  }
}