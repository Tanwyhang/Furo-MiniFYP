/**
 * Update Test Providers Script
 *
 * This script updates all API provider wallet addresses to use a single test address
 * for P2P direct payment testing.
 *
 * Run with: pnpm tsx test/update-test-providers.ts
 */

import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// Test wallet address for P2P testing
const TEST_WALLET_ADDRESS = '0x28adcf970a21f9fe1da1f5770670a55f76c4e995';
const TEST_PROVIDER_NAME = 'Test Provider P2P';

async function updateAllProviders() {
  console.log('🔄 Updating all providers to use test wallet address for P2P testing...');
  console.log(`📍 Test wallet address: ${TEST_WALLET_ADDRESS}`);
  console.log('='.repeat(60));

  try {
    // Update all existing providers to use the test wallet address
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

    // Get or create the test provider
    let testProvider = await prisma.provider.findFirst({
      where: {
        walletAddress: TEST_WALLET_ADDRESS
      }
    });

    if (!testProvider) {
      testProvider = await prisma.provider.create({
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
      console.log(`✅ Test provider already exists: ${testProvider.name || 'Unknown Provider'}`);
      console.log(`   Wallet: ${testProvider.walletAddress}`);
    }

    // Update all APIs to use the test provider
    const apisUpdateResult = await prisma.api.updateMany({
      where: {
        providerId: {
          not: testProvider.id
        }
      },
      data: {
        providerId: testProvider.id,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated ${apisUpdateResult.count} APIs to use test provider`);

    // Verify the final configuration
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
      }
    });

    console.log('\n🎯 Final Configuration Summary:');
    console.log(`   Providers with test wallet: ${finalProviders.length}`);
    console.log(`   APIs linked to test provider: ${finalApis.length}`);

    console.log('\n📊 Provider Details:');
    finalProviders.forEach(provider => {
      console.log(`   - ${provider.name || 'Unknown Provider'} (${provider.walletAddress})`);
    });

    console.log('\n🎉 P2P testing setup complete!');
    console.log(`\n🔗 Test Wallet Address: ${TEST_WALLET_ADDRESS}`);
    console.log('💰 Make sure this wallet has test ETH for testing');

  } catch (error) {
    console.error('❌ Error updating test providers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateAllProviders().catch(console.error);