/**
 * Update Test Providers Script (JavaScript)
 *
 * This script updates all API provider wallet addresses to use the test address
 * for P2P direct payment testing.
 *
 * Run with: node test/update-providers.js
 */

const { PrismaClient } = require('../lib/generated/prisma/client');

const prisma = new PrismaClient();

// Test wallet address for P2P testing
const TEST_WALLET_ADDRESS = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995';
const TEST_PROVIDER_NAME = 'Test Provider P2P';

async function updateAllProviders() {
  console.log('🔄 Updating all providers to use test wallet address for P2P testing...');
  console.log(`📍 Test wallet address: ${TEST_WALLET_ADDRESS}`);
  console.log('='.repeat(60));

  try {
    // Update all existing providers
    const updateResult = await prisma.provider.updateMany({
      where: {
        walletAddress: {
          not: TEST_WALLET_ADDRESS
        }
      },
      data: {
        walletAddress: TEST_WALLET_ADDRESS,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated ${updateResult.count} existing providers to test wallet address`);

    // Create a test provider if it doesn't exist
    const existingTestProvider = await prisma.provider.findFirst({
      where: {
        walletAddress: TEST_WALLET_ADDRESS
      }
    });

    if (!existingTestProvider) {
      const testProvider = await prisma.provider.create({
        data: {
          id: `provider_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          walletAddress: TEST_WALLET_ADDRESS,
          name: TEST_PROVIDER_NAME,
          isActive: true,
          reputationScore: 4.5,
          totalEarnings: '0',
          totalCalls: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Created test provider: ${testProvider.name} (${testProvider.id})`);
      console.log(`   Wallet: ${testProvider.walletAddress}`);
    } else {
      console.log(`✅ Test provider already exists: ${existingTestProvider.name}`);
      console.log(`   Wallet: ${existingTestProvider.walletAddress}`);
    }

    // Update all APIs to use the test provider
    const apisUpdateResult = await prisma.api.updateMany({
      where: {
        providerId: {
          not: existingTestProvider?.id || ''
        }
      },
      data: {
        providerId: existingTestProvider?.id || `provider_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated ${apisUpdateResult.count} APIs to use test provider`);

    // Create a test API if none exist
    const existingTestApi = await prisma.api.findFirst({
      where: {
        providerId: existingTestProvider?.id || ''
      }
    });

    if (!existingTestApi) {
      const testApi = await prisma.api.create({
        data: {
          id: `api_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          providerId: existingTestProvider?.id || `provider_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          name: 'Test P2P API',
          description: 'Test API for P2P direct payment testing. This API demonstrates zero-fee direct payments from developers to providers.',
          category: 'Testing',
          endpoint: 'https://api.example.com/test',
          publicPath: '/test-p2p-api',
          method: 'GET',
          pricePerCall: '10000000000000', // 0.00001 ETH (very cheap for testing)
          currency: 'ETH',
          isActive: true,
          totalCalls: 0,
          totalRevenue: '0',
          averageResponseTime: 100,
          uptime: 99.9,
          documentation: JSON.stringify({
            description: 'Test API for P2P direct payments',
            pricing: '0.00001 ETH per call',
            example: {
              method: 'GET',
              url: '/test-p2p-api',
              response: {
                message: 'Hello from P2P Test API!',
                timestamp: '2024-01-01T00:00:00Z',
                provider: 'Test Provider P2P'
              }
            }
          }),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Created test API: ${testApi.name} (${testApi.id})`);
      console.log(`   Price: ${testApi.pricePerCall} wei ETH per call`);
      console.log(`   Public Path: ${testApi.publicPath}`);
    } else {
      console.log(`✅ Test API already exists: ${existingTestApi.name}`);
      console.log(`   Public Path: ${existingTestApi.publicPath}`);
    }

    // Verify the updates
    const finalProviders = await prisma.provider.findMany({
      where: {
        walletAddress: TEST_WALLET_ADDRESS
      }
    });

    const finalApis = await prisma.api.findMany({
      where: {
        providerId: {
          in: finalProviders.map(p => p.id)
        }
      },
      include: {
        Provider: {
          select: {
            name: true,
            walletAddress: true
          }
        }
      }
    });

    console.log('\n🎯 Final Configuration Summary:');
    console.log(`   Providers with test wallet: ${finalProviders.length}`);
    console.log(`   APIs linked to test provider: ${finalApis.length}`);
    console.log('\n📊 Provider Details:');
    finalProviders.forEach(provider => {
      console.log(`   - ${provider.name} (${provider.walletAddress})`);
    });

    console.log('\n📋 Available Test APIs:');
    finalApis.forEach(api => {
      const pricePerCall = BigInt(api.pricePerCall);
      const priceInETH = Number(pricePerCall) / 1000000000000000000; // Convert from wei to ETH
      console.log(`   - ${api.name} (${api.publicPath}) - ${priceInETH} ETH per call`);
    });

    console.log('\n🎉 P2P testing setup complete!');
    console.log(`\n🔗 Test Wallet Address: ${TEST_WALLET_ADDRESS}`);
    console.log('💰 Make sure this wallet has test ETH for testing');

  } catch (error) {
    console.error('❌ Error updating test providers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateAllProviders().catch(console.error);