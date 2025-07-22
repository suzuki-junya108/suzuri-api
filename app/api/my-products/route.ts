import { NextRequest, NextResponse } from 'next/server';
import SuzuriClient from '@/lib/suzuri-client';
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

const suzuriClient = new SuzuriClient(
  process.env.SUZURI_API_KEY!
);

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId');
    const userName = searchParams.get('userName');
    const materialId = searchParams.get('materialId');
    
    // Validate parameters
    if (!userId && !userName) {
      return NextResponse.json(
        { error: 'Either userId or userName parameter is required' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    // Get user products
    const result = await suzuriClient.getUserProducts(
      userId ? parseInt(userId) : undefined,
      userName || undefined,
      limit,
      offset
    );
    
    // Filter by materialId if provided
    let filteredProducts = result.products;
    if (materialId) {
      const materialIdNum = parseInt(materialId);
      filteredProducts = result.products.filter(product => 
        product.material?.id === materialIdNum
      );
    }
    
    // Format response with complete URLs
    const productsWithUrls = filteredProducts.map(product => {
      const username = product.material?.user?.name || userName || 'suzuri';
      const materialId = product.material?.id;
      const sampleVariant = product.sampleItemVariant;
      const item = product.item;
      
      // Build complete URL
      const completeUrl = product.sampleUrl || 
        (materialId && item && sampleVariant
          ? `https://suzuri.jp/${username}/${materialId}/${item.name}/${sampleVariant.size.name}/${sampleVariant.color.name}`
          : product.url);
      
      return {
        id: product.id,
        title: product.title,
        url: completeUrl,
        sampleImageUrl: product.sampleImageUrl,
        published: product.published,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        price: product.price,
        priceWithTax: product.priceWithTax,
        item: item ? {
          id: item.id,
          name: item.humanizeName || item.name,
        } : undefined,
        material: materialId ? {
          id: materialId,
          title: product.material?.title,
          thumbnailUrl: product.material?.thumbnailUrl,
        } : undefined,
      };
    });
    
    return NextResponse.json({
      success: true,
      products: productsWithUrls,
      pagination: {
        ...result.pagination,
        count: materialId ? productsWithUrls.length : result.pagination.count,
        filtered: materialId ? true : false,
      },
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Failed to fetch user products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}