import axios, { AxiosInstance } from 'axios';

export interface SuzuriProduct {
  id: number;
  title: string;
  sampleUrl: string;
  sampleImageUrl: string;
  published: boolean;
  resizeMode: string;
  url: string;
  itemId?: number;
  createdAt?: string;
  updatedAt?: string;
  price?: number;
  priceWithTax?: number;
  item?: {
    id: number;
    name: string;
    humanizeName: string;
    angles: string[];
    published: boolean;
  };
  material?: {
    id: number;
    title?: string;
    thumbnailUrl?: string;
    user?: {
      name: string;
    };
  };
  sampleItemVariant?: {
    id: number;
    price: number;
    color: {
      id: number;
      name: string;
      displayName: string;
    };
    size: {
      id: number;
      name: string;
      displayName: string;
    };
  };
}

export interface SuzuriItem {
  id: number;
  humanizeName: string;
  exemplaryAngle: string;
  published: boolean;
  variants: Array<{
    id: number;
    color: string;
    size: string;
    price: number;
  }>;
}

export interface SuzuriMaterial {
  id: number;
  texture: string;
  title: string;
  description?: string;
}

export interface CreateMaterialRequest {
  title: string;
  description?: string;
  texture: string; // Base64 data URI
  products?: Array<{
    itemId: number;
    published?: boolean;
    resizeMode?: 'contain' | 'cover';
    sub_materials?: Array<{ // snake_case for API
      texture: string; // Base64 data URI
      printSide: 'front' | 'back';
      enabled: boolean;
      resizeMode?: 'contain' | 'cover';
    }>;
  }>;
}

export interface CreateMaterialResponse {
  material: SuzuriMaterial & {
    user?: {
      name: string;
    };
  };
  products: SuzuriProduct[];
}

class SuzuriClient {
  private api: AxiosInstance;
  
  constructor(apiKey: string) {
    this.api = axios.create({
      baseURL: 'https://suzuri.jp/api/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createMaterial(imageBuffer: Buffer | { front: Buffer; back: Buffer }, request: Omit<CreateMaterialRequest, 'texture'>): Promise<CreateMaterialResponse> {
    let payload: CreateMaterialRequest;
    
    if (Buffer.isBuffer(imageBuffer)) {
      // Single image
      const base64Image = imageBuffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64Image}`;
      
      payload = {
        texture: dataUri,
        title: request.title,
        description: request.description || '',
        products: request.products || [
          {
            itemId: 1, // T-shirt
            published: true,
            resizeMode: 'contain',
          },
        ],
      };
    } else {
      // Front and back images for items that support multiple print sides
      const frontBase64 = imageBuffer.front.toString('base64');
      const backBase64 = imageBuffer.back.toString('base64');
      const frontDataUri = `data:image/png;base64,${frontBase64}`;
      const backDataUri = `data:image/png;base64,${backBase64}`;
      
      // For Full Graphic T-shirt and Clear File, we need both texture and sub_materials
      payload = {
        texture: frontDataUri, // Main texture is the front image
        title: request.title,
        description: request.description || '',
        products: (request.products || []).map(product => ({
          ...product,
          sub_materials: [ // Note: API uses snake_case
            {
              texture: backDataUri,
              printSide: 'back',
              enabled: true,
              resizeMode: product.resizeMode || 'cover', // Apply same resize mode to back
            },
          ],
        })),
      };
    }

    try {
      const response = await this.api.post('/materials', payload);
      console.log('SUZURI API Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('SUZURI API Error Status:', error.response?.status);
        console.error('SUZURI API Error Data:', error.response?.data);
        console.error('SUZURI API Request Data:', payload);
        throw new Error(`SUZURI API Error: ${JSON.stringify(error.response?.data) || error.message}`);
      }
      throw error;
    }
  }

  async getProduct(productId: number): Promise<SuzuriProduct> {
    const response = await this.api.get(`/products/${productId}`);
    return response.data.product;
  }

  async getAvailableItems(): Promise<SuzuriItem[]> {
    try {
      const response = await this.api.get('/items');
      return response.data.items || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to fetch items:', error.response?.data);
      }
      throw error;
    }
  }

  async getUserProducts(userId?: number, userName?: string, materialId?: number, limit: number = 20, offset: number = 0): Promise<{
    products: SuzuriProduct[];
    pagination: {
      limit: number;
      offset: number;
      count: number;
    };
  }> {
    try {
      const params: Record<string, string | number> = {
        limit,
        offset,
      };
      
      if (userId) {
        params.userId = userId;
      } else if (userName) {
        params.userName = userName;
      }
      
      if (materialId) {
        params.materialId = materialId;
      }
      
      const response = await this.api.get('/products', { params });
      return {
        products: response.data.products || [],
        pagination: {
          limit: response.data.limit || limit,
          offset: response.data.offset || offset,
          count: response.data.count || 0,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to fetch user products:', error.response?.data);
      }
      throw error;
    }
  }
}

export default SuzuriClient;