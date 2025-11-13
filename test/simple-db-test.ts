import { PrismaClient } from '@/lib/generated/prisma/client';

console.log('🧪 Starting Simple Database Test...');

async function testDatabase() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test all model access
    console.log('\n📊 Testing model access...');

    const counts = await Promise.all([
      prisma.provider.count(),
      prisma.api.count(),
      prisma.payment.count(),
      prisma.token.count(),
      prisma.usageLog.count(),
      prisma.favorite.count(),
      prisma.review.count(),
      prisma.apiKey.count(),
      prisma.configuration.count()
    ]);

    const models = ['Provider', 'API', 'Payment', 'Token', 'UsageLog', 'Favorite', 'Review', 'ApiKey', 'Configuration'];

    models.forEach((model, index) => {
      console.log(`   ${model}: ${counts[index]} records`);
    });

    // Test creating a simple provider
    console.log('\n➕ Testing record creation...');
    const testProvider = await prisma.provider.create({
      data: {
        id: `test_provider_${Date.now()}`,
        walletAddress: `0x${Date.now().toString(16).padStart(40, '0')}`,
        name: 'Test Provider',
        description: 'Test provider for database verification',
        reputationScore: 5.0,
        totalEarnings: '0',
        totalCalls: 0,
        isActive: true,
        updatedAt: new Date()
      }
    });

    console.log(`   ✅ Created provider: ${testProvider.name} (${testProvider.id})`);

    // Clean up test provider
    await prisma.provider.delete({
      where: { id: testProvider.id }
    });

    console.log(`   🧹 Cleaned up test provider`);

    await prisma.$disconnect();
    console.log('\n✅ All database tests passed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testDatabase();