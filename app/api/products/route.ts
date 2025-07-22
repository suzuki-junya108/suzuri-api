import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import SuzuriClient from '@/lib/suzuri-client';
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

const suzuriClient = new SuzuriClient(
  process.env.SUZURI_API_KEY!
);

interface CreateProductRequest {
  imagePath: string;
  title: string;
  description?: string;
  published?: boolean;
  resizeMode?: 'contain' | 'cover';
  itemId?: number;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateProductRequest;

    // Validate required fields
    if (!body.imagePath || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: imagePath and title' },
        { status: 400 }
      );
    }

    // Read image file
    let imageBuffer: Buffer;
    try {
      imageBuffer = await fs.readFile(body.imagePath);
    } catch {
      return NextResponse.json(
        { error: 'Failed to read image file' },
        { status: 400 }
      );
    }

    // Create material and product on SUZURI
    const response = await suzuriClient.createMaterial(imageBuffer, {
      title: body.title,
      description: body.description,
      products: [
        {
          itemId: body.itemId || 1, // Default to T-shirt
          published: body.published !== false,
          resizeMode: body.resizeMode || 'contain',
        },
      ],
    });

    // Clean up temporary file
    try {
      await fs.unlink(body.imagePath);
    } catch (error) {
      console.warn('Failed to delete temporary file:', error);
    }

    // Get the first product from the response
    const product = response.products[0];

    // Extract data from the response
    const username = response.material?.user?.name || 'suzuri';
    const materialId = response.material?.id;
    const item = product.item;
    const sampleVariant = product.sampleItemVariant;
    
    // Build complete URL using the sampleUrl as base
    const completeUrl = product.sampleUrl || 
      `https://suzuri.jp/${username}/${materialId}/${item?.name || 'product'}/${sampleVariant?.size?.name || 's'}/${sampleVariant?.color?.name || 'white'}`;

    // Get available variants from the actual API response
    const availableVariants = [];
    if (item && product.url) {
      // Common T-shirt sizes and colors based on SUZURI standards
      const sizes = ['s', 'm', 'l', 'xl'];
      const colors = ['white', 'gray', 'black', 'navy', 'red'];
      
      sizes.forEach(size => {
        colors.forEach(color => {
          availableVariants.push({
            size,
            color,
            url: `https://suzuri.jp/${username}/${materialId}/${item.name}/${size}/${color}`
          });
        });
      });
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        url: completeUrl,
        sampleImageUrl: product.sampleImageUrl,
        sampleUrl: product.sampleUrl,
        published: product.published,
      },
      material: {
        id: materialId,
      },
      item: {
        id: item?.id || body.itemId || 1,
        name: item?.humanizeName || item?.name || 'Product',
        variants: availableVariants,
      },
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      // Get available items
      const items = await suzuriClient.getAvailableItems();
      return NextResponse.json({
        items: items.map(item => ({
          id: item.id,
          name: item.humanizeName,
          exemplaryAngle: item.exemplaryAngle,
          published: item.published,
        })),
      }, { headers: corsHeaders() });
    }

    // Get specific product
    const product = await suzuriClient.getProduct(parseInt(productId));
    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        url: product.url,
        sampleImageUrl: product.sampleImageUrl,
        published: product.published,
      },
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product information' },
      { status: 500, headers: corsHeaders() }
    );
  }
}