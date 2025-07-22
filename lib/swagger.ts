import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'SUZURI API Server',
        version: '1.0.0',
        description: 'API server for creating SUZURI merchandise from uploaded images. Common item types: 1=Tシャツ, 2=パーカー, 3=トートバッグ, 6=マグカップ, 14=ステッカー, 20=アクリルブロック',
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production' 
            ? 'https://your-domain.com'
            : 'http://localhost:3000',
          description: process.env.NODE_ENV === 'production' 
            ? 'Production server'
            : 'Development server',
        },
      ],
      components: {
        schemas: {
          UploadResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              file: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  path: { type: 'string' },
                  size: { type: 'number' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                  format: { type: 'string' },
                },
              },
            },
          },
          CreateProductRequest: {
            type: 'object',
            required: ['imagePath', 'title'],
            properties: {
              imagePath: { 
                type: 'string',
                description: 'Path to the uploaded image file',
              },
              title: { 
                type: 'string',
                description: 'Product title',
              },
              description: { 
                type: 'string',
                description: 'Product description',
              },
              published: { 
                type: 'boolean',
                default: true,
                description: 'Whether to publish the product immediately',
              },
              resizeMode: { 
                type: 'string',
                enum: ['contain', 'cover'],
                default: 'contain',
                description: 'How the image should be resized',
              },
              itemId: { 
                type: 'integer',
                default: 1,
                description: 'Item type ID. Common types: 1=Tシャツ, 2=パーカー, 3=トートバッグ, 6=マグカップ, 14=ステッカー, 20=アクリルブロック, etc. See /api/items for full list.',
                example: 1,
              },
            },
          },
          ProductResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  title: { type: 'string' },
                  url: { type: 'string' },
                  sampleImageUrl: { type: 'string' },
                  published: { type: 'boolean' },
                },
              },
              item: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  variants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        color: { type: 'string' },
                        size: { type: 'string' },
                        price: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'string' },
            },
          },
          CreateProductDirectResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  title: { type: 'string' },
                  url: { type: 'string' },
                  sampleImageUrl: { type: 'string' },
                  published: { type: 'boolean' },
                },
              },
              item: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  variants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        color: { type: 'string' },
                        size: { type: 'string' },
                        price: { type: 'number' },
                      },
                    },
                  },
                },
              },
              uploadedImage: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  url: { type: 'string' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                },
              },
            },
          },
        },
      },
      paths: {
        '/api/upload': {
          post: {
            summary: 'Upload an image',
            description: 'Upload an image file for creating SUZURI products',
            tags: ['Upload'],
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      file: {
                        type: 'string',
                        format: 'binary',
                        description: 'Image file (JPEG, PNG, or WebP)',
                      },
                    },
                    required: ['file'],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Successful upload',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UploadResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Bad request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Internal server error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/api/products': {
          post: {
            summary: 'Create a SUZURI product',
            description: 'Create a new product on SUZURI using an uploaded image',
            tags: ['Products'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateProductRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Product created successfully',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ProductResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Bad request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Internal server error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          get: {
            summary: 'Get product information',
            description: 'Get information about available items or a specific product',
            tags: ['Products'],
            parameters: [
              {
                name: 'id',
                in: 'query',
                description: 'Product ID (if not provided, returns available items)',
                required: false,
                schema: {
                  type: 'integer',
                },
              },
            ],
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      oneOf: [
                        {
                          type: 'object',
                          properties: {
                            items: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'number' },
                                  name: { type: 'string' },
                                  exemplaryAngle: { type: 'string' },
                                  published: { type: 'boolean' },
                                },
                              },
                            },
                          },
                        },
                        {
                          type: 'object',
                          properties: {
                            product: {
                              type: 'object',
                              properties: {
                                id: { type: 'number' },
                                title: { type: 'string' },
                                url: { type: 'string' },
                                sampleImageUrl: { type: 'string' },
                                published: { type: 'boolean' },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
              '500': {
                description: 'Internal server error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/api/create-product': {
          post: {
            summary: 'Create a product directly from image upload',
            description: 'Upload an image and create a SUZURI product in a single request',
            tags: ['Products'],
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      file: {
                        type: 'string',
                        format: 'binary',
                        description: 'Image file (JPEG, PNG, or WebP)',
                      },
                      title: {
                        type: 'string',
                        description: 'Product title',
                      },
                      description: {
                        type: 'string',
                        description: 'Product description (optional)',
                      },
                      published: {
                        type: 'boolean',
                        default: true,
                        description: 'Whether to publish the product immediately',
                      },
                      resizeMode: {
                        type: 'string',
                        enum: ['contain', 'cover'],
                        default: 'contain',
                        description: 'How the image should be resized',
                      },
                      itemId: {
                        type: 'integer',
                        default: 1,
                        description: 'Item type ID. Common types: 1=Tシャツ, 2=パーカー, 3=トートバッグ, 6=マグカップ, 14=ステッカー, 20=アクリルブロック, etc. See /api/items for full list.',
                        example: 1,
                      },
                    },
                    required: ['file', 'title'],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Product created successfully',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CreateProductDirectResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Bad request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Internal server error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/api/items': {
          get: {
            summary: 'Get available item types',
            description: 'Get a list of available item types that can be used to create products. Common item IDs include: 1=Tシャツ, 2=パーカー, 3=トートバッグ, 6=マグカップ, 14=ステッカー, 20=アクリルブロック, and more.',
            tags: ['Items'],
            responses: {
              '200': {
                description: 'List of available items',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { 
                                type: 'number',
                                description: 'Item ID to use when creating products',
                                example: 1,
                              },
                              name: { 
                                type: 'string',
                                description: 'Human-readable name of the item',
                                example: 'スタンダードTシャツ',
                              },
                              exemplaryAngle: { 
                                type: 'string',
                                description: 'Default view angle',
                              },
                              published: { 
                                type: 'boolean',
                                description: 'Whether the item is published',
                              },
                              variantCount: { 
                                type: 'number',
                                description: 'Number of available variants',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              '500': {
                description: 'Internal server error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    apiFolder: 'app/api',
  });
  
  return spec;
};