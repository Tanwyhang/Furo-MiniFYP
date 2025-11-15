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
    status: 'active',
    totalFavorites: 512
  },
  {
    id: '3',
    name: 'AI Text Generator',
    description: 'Generate human-like text using advanced AI models',
    category: 'AI',
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
    category: 'AI',
    price: 0.002,
    currency: 'ETH',
    provider: '0xdef0...1234',
    rating: 4.6,
    totalCalls: 12100,
    endpoint: 'https://api.vision.com/v1/analyze',
    status: 'active',
    totalFavorites: 76
  },
  {
    id: '5',
    name: 'Geolocation Service',
    description: 'Convert IP addresses to geographical locations',
    category: 'Data',
    price: 0.0001,
    currency: 'ETH',
    provider: '0x5678...9012',
    rating: 4.5,
    totalCalls: 45200,
    endpoint: 'https://api.geoip.com/v1/locate',
    status: 'active',
    totalFavorites: 156
  },
  {
    id: '6',
    name: 'Email Validation',
    description: 'Verify email addresses and check deliverability',
    category: 'Utility',
    price: 0.0002,
    currency: 'ETH',
    provider: '0x3456...7890',
    rating: 4.4,
    totalCalls: 23400,
    endpoint: 'https://api.emailcheck.com/v1/verify',
    status: 'active',
    totalFavorites: 89
  },
  {
    id: '7',
    name: 'Stock Market Data',
    description: 'Real-time stock prices and financial market data',
    category: 'Finance',
    price: 0.003,
    currency: 'ETH',
    provider: '0x2345...6789',
    rating: 4.7,
    totalCalls: 18700,
    endpoint: 'https://api.stocks.com/v1/quotes',
    status: 'active',
    totalFavorites: 203
  },
  {
    id: '8',
    name: 'Currency Converter',
    description: 'Real-time currency exchange rates and conversion',
    category: 'Finance',
    price: 0.0001,
    currency: 'ETH',
    provider: '0x7890...1234',
    rating: 4.9,
    totalCalls: 32100,
    endpoint: 'https://api.currency.com/v1/convert',
    status: 'active',
    totalFavorites: 145
  },
  {
    id: '9',
    name: 'Gaming Leaderboard',
    description: 'Manage leaderboards and player rankings for games',
    category: 'Gaming',
    price: 0.0005,
    currency: 'ETH',
    provider: '0x9012...3456',
    rating: 4.3,
    totalCalls: 8900,
    endpoint: 'https://api.gaming.com/v1/leaderboard',
    status: 'active',
    totalFavorites: 67
  },
  {
    id: '10',
    name: 'Social Media Analytics',
    description: 'Track social media metrics and engagement data',
    category: 'Social',
    price: 0.002,
    currency: 'ETH',
    provider: '0x6789...0123',
    rating: 4.6,
    totalCalls: 12300,
    endpoint: 'https://api.social.com/v1/analytics',
    status: 'active',
    totalFavorites: 178
  },
  {
    id: '11',
    name: 'PDF Generator',
    description: 'Convert HTML and documents to PDF format',
    category: 'Utility',
    price: 0.001,
    currency: 'ETH',
    provider: '0x0123...4567',
    rating: 4.8,
    totalCalls: 15600,
    endpoint: 'https://api.pdfgen.com/v1/create',
    status: 'active',
    totalFavorites: 234
  },
  {
    id: '12',
    name: 'AI Chat Assistant',
    description: 'Intelligent conversational AI for customer support',
    category: 'AI',
    price: 0.005,
    currency: 'ETH',
    provider: '0x1111...2222',
    rating: 4.5,
    totalCalls: 6700,
    endpoint: 'https://api.chatbot.com/v1/converse',
    status: 'active',
    totalFavorites: 312
  },
  {
    id: '13',
    name: 'URL Shortener',
    description: 'Create and manage short URLs with analytics',
    category: 'Utility',
    price: 0.00005,
    currency: 'ETH',
    provider: '0x3333...4444',
    rating: 4.2,
    totalCalls: 54300,
    endpoint: 'https://api.shorten.com/v1/create',
    status: 'active',
    totalFavorites: 45
  },
  {
    id: '14',
    name: 'News Aggregator',
    description: 'Real-time news articles and headlines from multiple sources',
    category: 'Data',
    price: 0.0008,
    currency: 'ETH',
    provider: '0x5555...6666',
    rating: 4.4,
    totalCalls: 19200,
    endpoint: 'https://api.news.com/v1/articles',
    status: 'active',
    totalFavorites: 128
  },
  {
    id: '15',
    name: 'Translation Service',
    description: 'Translate text between 100+ languages',
    category: 'Utility',
    price: 0.0015,
    currency: 'ETH',
    provider: '0x7777...8888',
    rating: 4.7,
    totalCalls: 28900,
    endpoint: 'https://api.translate.com/v1/translate',
    status: 'active',
    totalFavorites: 267
  },
  {
    id: '16',
    name: 'Image Processing',
    description: 'Resize, crop, and filter images programmatically',
    category: 'Media',
    price: 0.0003,
    currency: 'ETH',
    provider: '0x9999...0000',
    rating: 4.6,
    totalCalls: 41200,
    endpoint: 'https://api.images.com/v1/process',
    status: 'active',
    totalFavorites: 189
  },
  {
    id: '17',
    name: 'SMS Gateway',
    description: 'Send SMS messages worldwide',
    category: 'Communication',
    price: 0.01,
    currency: 'ETH',
    provider: '0xaaaa...bbbb',
    rating: 4.5,
    totalCalls: 5600,
    endpoint: 'https://api.sms.com/v1/send',
    status: 'active',
    totalFavorites: 234
  },
  {
    id: '18',
    name: 'Video Streaming',
    description: 'Host and stream video content',
    category: 'Media',
    price: 0.02,
    currency: 'ETH',
    provider: '0xcccc...dddd',
    rating: 4.8,
    totalCalls: 3400,
    endpoint: 'https://api.video.com/v1/stream',
    status: 'inactive',
    totalFavorites: 456
  },
  {
    id: '19',
    name: 'QR Code Generator',
    description: 'Generate custom QR codes for various data types',
    category: 'Utility',
    price: 0.0001,
    currency: 'ETH',
    provider: '0xeeee...ffff',
    rating: 4.3,
    totalCalls: 67800,
    endpoint: 'https://api.qrcode.com/v1/generate',
    status: 'active',
    totalFavorites: 123
  },
  {
    id: '20',
    name: 'NFT Metadata',
    description: 'Create and manage NFT metadata',
    category: 'Blockchain',
    price: 0.001,
    currency: 'ETH',
    provider: '0x1111...aaaa',
    rating: 4.9,
    totalCalls: 8900,
    endpoint: 'https://api.nftmeta.com/v1/create',
    status: 'active',
    totalFavorites: 567
  }
];

export const categories = ['All', 'Weather', 'Finance', 'AI', 'Data', 'Utility', 'Gaming', 'Social', 'Media', 'Communication', 'Blockchain'];