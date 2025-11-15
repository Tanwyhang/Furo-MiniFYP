import { PrismaClient } from '@/lib/generated/prisma/client';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create multiple providers for different categories
  const providers = [
    {
      id: 'provider_weather',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b5',
      name: 'Weather Data Co',
      description: 'Providing accurate weather data for developers worldwide',
      website: 'https://weatherdata.example.com',
    },
    {
      id: 'provider_finance',
      walletAddress: '0x1234567890123456789012345678901234567890',
      name: 'FinanceHub',
      description: 'Real-time financial data and cryptocurrency services',
      website: 'https://financehub.example.com',
    },
    {
      id: 'provider_ai',
      walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      name: 'AI Solutions',
      description: 'Advanced AI and machine learning APIs',
      website: 'https://aisolutions.example.com',
    },
    {
      id: 'provider_data',
      walletAddress: '0x9876543210987654321098765432109876543210',
      name: 'Data Services Inc',
      description: 'Data enrichment and geolocation services',
      website: 'https://dataservices.example.com',
    },
    {
      id: 'provider_utility',
      walletAddress: '0x1111111111111111111111111111111111111111',
      name: 'Utility Tools',
      description: 'Essential utility APIs for developers',
      website: 'https://utilitytools.example.com',
    },
    {
      id: 'provider_gaming',
      walletAddress: '0x2222222222222222222222222222222222222222',
      name: 'GameTech APIs',
      description: 'Gaming and entertainment APIs',
      website: 'https://gametech.example.com',
    },
    {
      id: 'provider_social',
      walletAddress: '0x3333333333333333333333333333333333333333',
      name: 'Social Analytics',
      description: 'Social media and analytics services',
      website: 'https://socialanalytics.example.com',
    },
    {
      id: 'provider_media',
      walletAddress: '0x4444444444444444444444444444444444444444',
      name: 'Media Processing',
      description: 'Image, video, and media processing APIs',
      website: 'https://mediaprocessing.example.com',
    },
    {
      id: 'provider_communication',
      walletAddress: '0x5555555555555555555555555555555555555555',
      name: 'CommBridge',
      description: 'Communication and messaging APIs',
      website: 'https://commbridge.example.com',
    },
    {
      id: 'provider_blockchain',
      walletAddress: '0x6666666666666666666666666666666666666666',
      name: 'Blockchain Tools',
      description: 'Blockchain and NFT development tools',
      website: 'https://blockchaintools.example.com',
    },
  ];

  const createdProviders = new Map();
  for (const providerData of providers) {
    const provider = await prisma.provider.upsert({
      where: { walletAddress: providerData.walletAddress },
      update: {
        name: providerData.name,
        description: providerData.description,
        website: providerData.website,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        ...providerData,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    createdProviders.set(providerData.id, provider.id);
    console.log('✅ Created provider:', provider.name);
  }

  // Create APIs for each provider
  const apis = [
    // Weather APIs
    {
      id: 'api_weather_1',
      name: 'Weather Data API',
      description: 'Real-time weather data for any location worldwide',
      category: 'Weather',
      endpoint: 'https://api.weather.com/v1/current',
      publicPath: '/weather/current',
      method: 'GET',
      pricePerCall: '1000000000000000', // 0.001 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_weather',
      totalCalls: 15420,
    },
    // Finance APIs
    {
      id: 'api_finance_1',
      name: 'Crypto Price Feed',
      description: 'Live cryptocurrency prices and market data',
      category: 'Finance',
      endpoint: 'https://api.crypto.com/v1/prices',
      publicPath: '/crypto/prices',
      method: 'GET',
      pricePerCall: '500000000000000', // 0.0005 ETH
      currency: 'ETH',
      isActive: false, // Inactive for maintenance
      providerId: 'provider_finance',
      totalCalls: 28350,
    },
    {
      id: 'api_finance_2',
      name: 'Stock Market Data',
      description: 'Real-time stock prices and financial market data',
      category: 'Finance',
      endpoint: 'https://api.stocks.com/v1/quotes',
      publicPath: '/stocks/quotes',
      method: 'GET',
      pricePerCall: '3000000000000000', // 0.003 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_finance',
      totalCalls: 18700,
    },
    {
      id: 'api_finance_3',
      name: 'Currency Converter',
      description: 'Real-time currency exchange rates and conversion',
      category: 'Finance',
      endpoint: 'https://api.currency.com/v1/convert',
      publicPath: '/currency/convert',
      method: 'GET',
      pricePerCall: '100000000000000', // 0.0001 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_finance',
      totalCalls: 32100,
    },
    // AI APIs
    {
      id: 'api_ai_1',
      name: 'AI Text Generator',
      description: 'Generate human-like text using advanced AI models',
      category: 'AI',
      endpoint: 'https://api.aitext.com/v1/generate',
      publicPath: '/ai/generate-text',
      method: 'POST',
      pricePerCall: '10000000000000000', // 0.01 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_ai',
      totalCalls: 8920,
    },
    {
      id: 'api_ai_2',
      name: 'Image Recognition API',
      description: 'Identify objects, faces, and text in images',
      category: 'AI',
      endpoint: 'https://api.vision.com/v1/analyze',
      publicPath: '/ai/image-recognition',
      method: 'POST',
      pricePerCall: '2000000000000000', // 0.002 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_ai',
      totalCalls: 12100,
    },
    {
      id: 'api_ai_3',
      name: 'AI Chat Assistant',
      description: 'Intelligent conversational AI for customer support',
      category: 'AI',
      endpoint: 'https://api.chatbot.com/v1/converse',
      publicPath: '/ai/chat',
      method: 'POST',
      pricePerCall: '5000000000000000', // 0.005 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_ai',
      totalCalls: 6700,
    },
    // Data APIs
    {
      id: 'api_data_1',
      name: 'Geolocation Service',
      description: 'Convert IP addresses to geographical locations',
      category: 'Data',
      endpoint: 'https://api.geoip.com/v1/locate',
      publicPath: '/data/geolocation',
      method: 'GET',
      pricePerCall: '100000000000000', // 0.0001 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_data',
      totalCalls: 45200,
    },
    {
      id: 'api_data_2',
      name: 'News Aggregator',
      description: 'Real-time news articles and headlines from multiple sources',
      category: 'Data',
      endpoint: 'https://api.news.com/v1/articles',
      publicPath: '/data/news',
      method: 'GET',
      pricePerCall: '800000000000000', // 0.0008 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_data',
      totalCalls: 19200,
    },
    // Utility APIs
    {
      id: 'api_utility_1',
      name: 'Email Validation',
      description: 'Verify email addresses and check deliverability',
      category: 'Utility',
      endpoint: 'https://api.emailcheck.com/v1/verify',
      publicPath: '/utility/email-validate',
      method: 'POST',
      pricePerCall: '200000000000000', // 0.0002 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_utility',
      totalCalls: 23400,
    },
    {
      id: 'api_utility_2',
      name: 'PDF Generator',
      description: 'Convert HTML and documents to PDF format',
      category: 'Utility',
      endpoint: 'https://api.pdfgen.com/v1/create',
      publicPath: '/utility/pdf-generator',
      method: 'POST',
      pricePerCall: '1000000000000000', // 0.001 ETH
      currency: 'ETH',
      isActive: false, // Under maintenance
      providerId: 'provider_utility',
      totalCalls: 15600,
    },
    {
      id: 'api_utility_3',
      name: 'URL Shortener',
      description: 'Create and manage short URLs with analytics',
      category: 'Utility',
      endpoint: 'https://api.shorten.com/v1/create',
      publicPath: '/utility/shorten',
      method: 'POST',
      pricePerCall: '50000000000000', // 0.00005 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_utility',
      totalCalls: 54300,
    },
    {
      id: 'api_utility_4',
      name: 'Translation Service',
      description: 'Translate text between 100+ languages',
      category: 'Utility',
      endpoint: 'https://api.translate.com/v1/translate',
      publicPath: '/utility/translate',
      method: 'POST',
      pricePerCall: '1500000000000000', // 0.0015 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_utility',
      totalCalls: 28900,
    },
    {
      id: 'api_utility_5',
      name: 'QR Code Generator',
      description: 'Generate custom QR codes for various data types',
      category: 'Utility',
      endpoint: 'https://api.qrcode.com/v1/generate',
      publicPath: '/utility/qr-code',
      method: 'POST',
      pricePerCall: '100000000000000', // 0.0001 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_utility',
      totalCalls: 67800,
    },
    // Gaming APIs
    {
      id: 'api_gaming_1',
      name: 'Gaming Leaderboard',
      description: 'Manage leaderboards and player rankings for games',
      category: 'Gaming',
      endpoint: 'https://api.gaming.com/v1/leaderboard',
      publicPath: '/gaming/leaderboard',
      method: 'GET',
      pricePerCall: '500000000000000', // 0.0005 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_gaming',
      totalCalls: 8900,
    },
    // Social APIs
    {
      id: 'api_social_1',
      name: 'Social Media Analytics',
      description: 'Track social media metrics and engagement data',
      category: 'Social',
      endpoint: 'https://api.social.com/v1/analytics',
      publicPath: '/social/analytics',
      method: 'GET',
      pricePerCall: '2000000000000000', // 0.002 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_social',
      totalCalls: 12300,
    },
    // Media APIs
    {
      id: 'api_media_1',
      name: 'Image Processing',
      description: 'Resize, crop, and filter images programmatically',
      category: 'Media',
      endpoint: 'https://api.images.com/v1/process',
      publicPath: '/media/image-process',
      method: 'POST',
      pricePerCall: '300000000000000', // 0.0003 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_media',
      totalCalls: 41200,
    },
    {
      id: 'api_media_2',
      name: 'Video Streaming',
      description: 'Host and stream video content',
      category: 'Media',
      endpoint: 'https://api.video.com/v1/stream',
      publicPath: '/media/video-stream',
      method: 'GET',
      pricePerCall: '20000000000000000', // 0.02 ETH
      currency: 'ETH',
      isActive: false, // Inactive for realism
      providerId: 'provider_media',
      totalCalls: 3400,
    },
    // Communication APIs
    {
      id: 'api_communication_1',
      name: 'SMS Gateway',
      description: 'Send SMS messages worldwide',
      category: 'Communication',
      endpoint: 'https://api.sms.com/v1/send',
      publicPath: '/communication/sms',
      method: 'POST',
      pricePerCall: '10000000000000000', // 0.01 ETH
      currency: 'ETH',
      isActive: false, // Service temporarily unavailable
      providerId: 'provider_communication',
      totalCalls: 5600,
    },
    // Blockchain APIs
    {
      id: 'api_blockchain_1',
      name: 'NFT Metadata',
      description: 'Create and manage NFT metadata',
      category: 'Blockchain',
      endpoint: 'https://api.nftmeta.com/v1/create',
      publicPath: '/blockchain/nft-metadata',
      method: 'POST',
      pricePerCall: '1000000000000000', // 0.001 ETH
      currency: 'ETH',
      isActive: true,
      providerId: 'provider_blockchain',
      totalCalls: 8900,
    },
  ];

  for (const apiData of apis) {
    const actualProviderId = createdProviders.get(apiData.providerId);
    if (!actualProviderId) {
      console.error('❌ Provider not found for API:', apiData.name);
      continue;
    }

    const api = await prisma.api.upsert({
      where: { publicPath: apiData.publicPath },
      update: {
        name: apiData.name,
        description: apiData.description,
        category: apiData.category,
        endpoint: apiData.endpoint,
        publicPath: apiData.publicPath,
        method: apiData.method,
        pricePerCall: apiData.pricePerCall,
        currency: apiData.currency,
        isActive: apiData.isActive,
        providerId: actualProviderId,
        totalCalls: apiData.totalCalls,
        updatedAt: new Date(),
      },
      create: {
        ...apiData,
        providerId: actualProviderId,
        updatedAt: new Date(),
      },
    });
    console.log('✅ Created API:', api.name, `(${api.category})`);
  }

  console.log('🎉 Database seeded successfully!');
  console.log('📊 Created 10 providers and 20 APIs');
  console.log('🏷️  Categories: Weather, Finance, AI, Data, Utility, Gaming, Social, Media, Communication, Blockchain');
  console.log('💰 APIs are ready for testing with diverse price points and usage patterns');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });