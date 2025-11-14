import { PrismaClient } from '@/lib/generated/prisma/client';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test provider (use upsert to avoid duplicates)
  const provider = await prisma.provider.upsert({
    where: { id: 'provider_1' },
    update: {
      name: 'Weather Data Co',
      description: 'Providing accurate weather data for developers',
      website: 'https://weatherdata.example.com',
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'provider_1',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b5',
      name: 'Weather Data Co',
      description: 'Providing accurate weather data for developers',
      website: 'https://weatherdata.example.com',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created provider:', provider.name);

  // Create some test APIs
  const apis = [
    {
      id: 'api_weather_1',
      name: 'Current Weather API',
      description: 'Get current weather conditions for any location',
      category: 'Weather',
      endpoint: 'https://api.weather.com/current',
      publicPath: '/weather/current',
      method: 'GET',
      pricePerCall: '100000000000000', // 0.0001 ETH
      currency: 'ETH',
      isActive: true,
      providerId: provider.id,
      totalCalls: 1250,
      updatedAt: new Date(),
    },
    {
      id: 'api_weather_2',
      name: 'Weather Forecast API',
      description: 'Get 7-day weather forecasts with hourly details',
      category: 'Weather',
      endpoint: 'https://api.weather.com/forecast',
      publicPath: '/weather/forecast',
      method: 'GET',
      pricePerCall: '200000000000000', // 0.0002 ETH
      currency: 'ETH',
      isActive: true,
      providerId: provider.id,
      totalCalls: 890,
      updatedAt: new Date(),
    },
    {
      id: 'api_crypto_1',
      name: 'Crypto Price Feed',
      description: 'Real-time cryptocurrency prices and market data',
      category: 'Finance',
      endpoint: 'https://api.crypto.com/prices',
      publicPath: '/crypto/prices',
      method: 'GET',
      pricePerCall: '150000000000000', // 0.00015 ETH
      currency: 'ETH',
      isActive: true,
      providerId: provider.id,
      totalCalls: 2100,
      updatedAt: new Date(),
    },
    {
      id: 'api_ai_1',
      name: 'AI Text Generator',
      description: 'Generate human-like text using advanced AI models',
      category: 'AI',
      endpoint: 'https://api.ai.com/generate',
      publicPath: '/ai/generate-text',
      method: 'POST',
      pricePerCall: '500000000000000', // 0.0005 ETH
      currency: 'ETH',
      isActive: true,
      providerId: provider.id,
      totalCalls: 450,
      updatedAt: new Date(),
    },
  ];

  for (const apiData of apis) {
    const api = await prisma.api.upsert({
      where: { id: apiData.id },
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
        providerId: apiData.providerId,
        totalCalls: apiData.totalCalls,
      },
      create: apiData,
    });
    console.log('✅ Created API:', api.name);
  }

  console.log('🎉 Database seeded successfully!');
  console.log('📊 Created 1 provider and 4 APIs');
  console.log('💰 APIs are ready for testing favorites functionality');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });