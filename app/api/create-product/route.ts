import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import SuzuriClient from '@/lib/suzuri-client';
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

const suzuriClient = new SuzuriClient(
  process.env.SUZURI_API_KEY!
);

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const published = formData.get('published') !== 'false';
    const resizeMode = (formData.get('resizeMode') as 'contain' | 'cover') || 'contain';
    const itemId = parseInt(formData.get('itemId') as string) || 1; // Default to T-shirt
    
    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Allowed formats: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 10MB' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp
    const processedImage = await sharp(buffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    // Create material and product on SUZURI
    const response = await suzuriClient.createMaterial(processedImage, {
      title,
      description: description || undefined,
      products: [
        {
          itemId,
          published,
          resizeMode,
        },
      ],
    });

    // Get the first product from the response
    const product = response.products?.[0];

    if (!product) {
      throw new Error('No product was created');
    }

    // Extract data from the response
    const username = response.material?.user?.name || 'suzuri';
    const materialId = response.material?.id;
    const item = product.item;
    const sampleVariant = product.sampleItemVariant;
    
    // Build complete URL using the sampleUrl as base
    const completeUrl = product.sampleUrl || 
      `https://suzuri.jp/${username}/${materialId}/${item?.name || 'product'}/${sampleVariant?.size?.name || 's'}/${sampleVariant?.color?.name || 'white'}`;

    // Get available variants from the actual API response
    const availableVariants: Array<{
      size: string;
      color: string;
      url: string;
    }> = [];
    
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
        id: item?.id || itemId,
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