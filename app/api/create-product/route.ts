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

    // Get item details to build complete URLs
    const item = await suzuriClient.getItem(itemId);
    const username = response.material?.user?.name || 'suzuri';
    const materialId = response.material?.id;
    
    // Build complete URLs with default variant (first available)
    const defaultVariant = item.variants?.[0];
    const completeUrl = defaultVariant && materialId
      ? `https://suzuri.jp/${username}/${materialId}/${item.humanizeName.toLowerCase().replace(/\s+/g, '-')}/${defaultVariant.size}/${defaultVariant.color}`
      : product.url;

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        url: completeUrl,
        sampleImageUrl: product.sampleImageUrl,
        published: product.published,
      },
      material: {
        id: materialId,
      },
      item: {
        id: item.id,
        name: item.humanizeName,
        variants: item.variants?.map(v => ({
          id: v.id,
          color: v.color,
          size: v.size,
          price: v.price,
          url: materialId ? `https://suzuri.jp/${username}/${materialId}/${item.humanizeName.toLowerCase().replace(/\s+/g, '-')}/${v.size}/${v.color}` : null,
        })),
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