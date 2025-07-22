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
    const file = formData.get('file') as File | null;
    const fileBack = formData.get('fileBack') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const published = formData.get('published') !== 'false';
    const resizeMode = (formData.get('resizeMode') as 'contain' | 'cover') || 'contain';
    const itemId = parseInt(formData.get('itemId') as string) || 1; // Default to T-shirt
    
    // Check if this is a Full Graphic T-shirt or Clear File
    const requiresFrontBack = itemId === 8 || itemId === 101;
    
    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    if (requiresFrontBack && !fileBack) {
      return NextResponse.json(
        { error: 'Back image is required for Full Graphic T-shirt and Clear File' },
        { status: 400 }
      );
    }
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Process front image
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Allowed formats: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 10MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const processedImage = await sharp(buffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    let imageData: Buffer | { front: Buffer; back: Buffer };
    
    if (requiresFrontBack && fileBack) {
      // Validate back image
      if (!ALLOWED_FORMATS.includes(fileBack.type)) {
        return NextResponse.json(
          { error: 'Invalid back file format. Allowed formats: JPEG, PNG, WebP' },
          { status: 400 }
        );
      }

      if (fileBack.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Back file size exceeds maximum limit of 10MB' },
          { status: 400 }
        );
      }

      const bytesBack = await fileBack.arrayBuffer();
      const bufferBack = Buffer.from(bytesBack);
      const processedImageBack = await sharp(bufferBack)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();

      imageData = {
        front: processedImage,
        back: processedImageBack,
      };
    } else {
      imageData = processedImage;
    }

    // Create material and product on SUZURI
    const response = await suzuriClient.createMaterial(imageData, {
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