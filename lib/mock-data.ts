export interface API {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  provider: string;
  rating: number;
  totalCalls: number;
  endpoint: string;
  status: 'active' | 'inactive';
  isFavorited?: boolean; // Optional field for user-specific favorites
  totalFavorites: number; // Total number of users who favorited this API
}

export const mockAPIs: API[] = [
  {
    id: '1',
    name: 'Weather Data API',
    description: 'Real-time weather data for any location worldwide',
    category: 'Weather',
    price: 0.001,
    currency: 'ETH',
    provider: '0x1234...5678',
    rating: 4.8,
    totalCalls: 15420,
    endpoint: 'https://api.weather.com/v1/current',
    status: 'active',
    totalFavorites: 234
  },
  {
    id: '2',
    name: 'Crypto Price Feed',
    description: 'Live cryptocurrency prices and market data',
    category: 'Finance',
    price: 0.0005,
    currency: 'ETH',
    provider: '0xabcd...efgh',
    rating: 4.9,
    totalCalls: 28350,
    endpoint: 'https://api.crypto.com/v1/prices',
    status: 'inactive',
    totalFavorites: 512
  },
  {
    id: '3',
    name: 'AI Text Generator',
    description: 'Generate human-like text using advanced AI models',
    category: 'AI/ML',
    price: 0.01,
    currency: 'ETH',
    provider: '0x9876...5432',
    rating: 4.7,
    totalCalls: 8920,
    endpoint: 'https://api.aitext.com/v1/generate',
    status: 'active',
    totalFavorites: 189
  },
  {
    id: '4',
    name: 'Image Recognition API',
    description: 'Identify objects, faces, and text in images',
    category: 'AI/ML',
    price: 0.002,
    currency: 'ETH',
    provider: '0xdef0...1234',
    rating: 4.6,
    totalCalls: 12100,
    endpoint: 'https://api.vision.com/v1/analyze',
    status: 'active',
    totalFavorites: 76
  }
];

export const categories = ['All', 'Weather', 'Finance', 'AI/ML'];