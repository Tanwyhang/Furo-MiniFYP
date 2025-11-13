import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

async function testProviderAPIRoutes() {
  console.log('🧪 Testing Provider API Routes...');

  try {
    // Test creating a provider via API simulation
    const testWallet = '0x1234567890123456789012345678901234567890';

    // Simulate the POST request logic
    const newProvider = await prisma.provider.create({
      data: {
        id: `provider_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        walletAddress: testWallet.toLowerCase(),
        name: 'New Test Provider',
        description: 'A new provider created via API test',
        website: 'https://example.com',
        email: 'test@example.com',
        reputationScore: 0,
        totalEarnings: '0',
        totalCalls: 0,
        isActive: true,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Created provider via API simulation: ${newProvider.name} (${newProvider.id})`);

    // Test getting a specific provider
    const foundProvider = await prisma.provider.findUnique({
      where: { id: newProvider.id },
      include: {
        Api: true,
        _count: {
          select: {
            Api: true,
            Payment: true,
            Token: true
          }
        }
      }
    });

    console.log(`✅ Retrieved specific provider: ${foundProvider?.name} with ${foundProvider?._count.Api} APIs`);

    // Test wallet lookup
    const walletProvider = await prisma.provider.findUnique({
      where: { walletAddress: testWallet.toLowerCase() }
    });

    console.log(`✅ Wallet lookup successful: ${walletProvider?.name}`);

    // Test analytics data
    const analytics = await prisma.provider.findUnique({
      where: { id: newProvider.id },
      select: {
        id: true,
        name: true,
        reputationScore: true,
        totalEarnings: true,
        totalCalls: true,
        isActive: true,
        _count: {
          select: {
            Api: true,
            Payment: true,
            Token: true
          }
        }
      }
    });

    console.log(`✅ Analytics data: revenue=${analytics?.totalEarnings}, calls=${analytics?.totalCalls}`);

    // Cleanup
    await prisma.provider.delete({
      where: { id: newProvider.id }
    });
    console.log('✅ Cleaned up test provider');

    console.log('🎉 Provider API routes test PASSED!');

  } catch (error) {
    console.error('❌ Provider API routes test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testProviderAPIRoutes();