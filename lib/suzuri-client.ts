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
  item?: SuzuriItem;
  material?: {
    id: number;
    user?: {
      name: string;
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

  async createMaterial(imageBuffer: Buffer, request: Omit<CreateMaterialRequest, 'texture'>): Promise<CreateMaterialResponse> {
    // Convert image buffer to base64 data URI
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`;

    const payload = {
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

  async getItem(itemId: number): Promise<SuzuriItem> {
    const response = await this.api.get(`/items/${itemId}`);
    return response.data.item;
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
}

export default SuzuriClient;