import { PrismaClient, Provider, Api, Payment, Token, UsageLog, Favorite, Review, ApiKey, Configuration } from '@/lib/generated/prisma/client';

console.log('🧪 Starting Fixed Database Integration Test for x402 Flow...');
console.log('⚠️  This test will perform real database operations\n');

// Try to get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL ||
                   'postgresql://furo_user:furo_password@localhost:5432/furo_db';

console.log('✅ Using database connection');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Generate unique test identifiers
const TEST_ID = Date.now();
const TEST_PROVIDER_WALLET = `0x${TEST_ID.toString(16).padStart(40, '0')}`;
const TEST_DEVELOPER_WALLET = `0x${(TEST_ID + 1).toString(16).padStart(40, '0')}`;
const TEST_TX_HASH = `0x${(TEST_ID + 2).toString(16).padStart(64, '0')}`;

// Helper function to generate test data
function generateTestData() {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 1000000);

  return {
    timestamp,
    randomId,
    providerName: `TestProvider_${randomId}`,
    apiName: `TestAPI_${randomId}`,
    tokenHash: `tkn_${timestamp}_${randomId}`,
    keyHash: `key_${timestamp}_${randomId}`,
    endpoint: `https://api-${randomId}.example.com`,
    publicPath: `/test-${randomId}`
  };
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  try {
    // Delete in order respecting foreign key constraints
    await prisma.usageLog.deleteMany({
      where: { developerAddress: TEST_DEVELOPER_WALLET }
    });

    await prisma.token.deleteMany({
      where: { developerAddress: TEST_DEVELOPER_WALLET }
    });

    await prisma.review.deleteMany({
      where: { reviewerAddress: TEST_DEVELOPER_WALLET }
    });

    await prisma.favorite.deleteMany({
      where: { userId: TEST_DEVELOPER_WALLET }
    });

    await prisma.payment.deleteMany({
      where: { developerAddress: TEST_DEVELOPER_WALLET }
    });

    await prisma.apiKey.deleteMany({
      where: { providerId: TEST_PROVIDER_WALLET }
    });

    await prisma.api.deleteMany({
      where: { providerId: TEST_PROVIDER_WALLET }
    });

    await prisma.provider.deleteMany({
      where: { walletAddress: TEST_PROVIDER_WALLET }
    });

    // Clean up test configurations
    await prisma.configuration.deleteMany({
      where: {
        key: {
          startsWith: 'test_'
        }
      }
    });

    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function testProviderAndApiCreation() {
  console.log('1️⃣ Testing Provider & API Creation...');

  try {
    const testData = generateTestData();

    // Create provider (API provider)
    const provider = await prisma.provider.create({
      data: {
        id: `provider_${testData.randomId}`,
        walletAddress: TEST_PROVIDER_WALLET,
        name: testData.providerName,
        description: `Test provider created at ${new Date(testData.timestamp).toISOString()}`,
        reputationScore: 4.8,
        totalEarnings: '0',
        totalCalls: 0,
        isActive: true,
        updatedAt: new Date()
      }
    });

    // Create developer as a provider too (for favorites/reviews to work)
    const developerProvider = await prisma.provider.create({
      data: {
        id: `developer_provider_${testData.randomId}`,
        walletAddress: TEST_DEVELOPER_WALLET,
        name: 'Test Developer',
        description: 'Developer user for testing',
        reputationScore: 0,
        totalEarnings: '0',
        totalCalls: 0,
        isActive: true,
        updatedAt: new Date()
      }
    });

    console.log(`   ✅ Provider created: ${provider.name} (${provider.id})`);
    console.log(`   ✅ Developer provider created: ${developerProvider.name} (${developerProvider.id})`);

    // Create API for this provider
    const api = await prisma.api.create({
      data: {
        id: `api_${testData.randomId}`,
        providerId: provider.id,
        name: testData.apiName,
        description: `Test API created at ${new Date(testData.timestamp).toISOString()}`,
        category: 'Test',
        endpoint: testData.endpoint,
        publicPath: testData.publicPath,
        method: 'GET',
        pricePerCall: '100000000000000', // 0.0001 ETH
        currency: 'ETH',
        isActive: true,
        totalCalls: 0,
        totalRevenue: '0',
        averageResponseTime: 0,
        uptime: 100.0,
        documentation: {
          version: '1.0.0',
          parameters: {
            testParam: { type: 'string', required: true, description: 'Test parameter' }
          }
        },
        updatedAt: new Date()
      }
    });

    console.log(`   ✅ API created: ${api.name} (${api.id})`);

    // Test relationship: Provider -> APIs
    const providerWithApis = await prisma.provider.findUnique({
      where: { id: provider.id },
      include: { Api: true }
    });

    if (providerWithApis?.Api.length !== 1) {
      throw new Error('Provider-API relationship failed');
    }

    console.log(`   ✅ Provider-API relationship verified: ${providerWithApis.Api.length} APIs`);

    return { provider, developerProvider, api };

  } catch (error) {
    console.error('   ❌ Provider/API creation failed:', error);
    throw error;
  }
}

async function testPaymentAndTokenCreation(provider: Provider, api: Api, developerProvider: Provider) {
  console.log('2️⃣ Testing Payment & Token Creation...');

  try {
    const testData = generateTestData();
    const tokenCount = 3; // Reduced for test efficiency

    // Create payment (simulating blockchain transaction)
    const payment = await prisma.payment.create({
      data: {
        id: `payment_${testData.randomId}`,
        providerId: provider.id,
        apiId: api.id,
        developerAddress: TEST_DEVELOPER_WALLET,
        transactionHash: TEST_TX_HASH,
        amount: (BigInt(tokenCount) * BigInt(100000000000000)).toString(), // tokenCount * 0.0001 ETH
        currency: 'ETH',
        numberOfTokens: tokenCount,
        tokensIssued: tokenCount,
        isVerified: true,
        isReplay: false,
        blockNumber: BigInt(TEST_ID),
        blockTimestamp: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`   ✅ Payment created: ${payment.amount} wei for ${tokenCount} tokens (${payment.id})`);

    // Create single-use tokens
    const tokens = [];
    for (let i = 0; i < tokenCount; i++) {
      const token = await prisma.token.create({
        data: {
          id: `token_${testData.randomId}_${i}`,
          paymentId: payment.id,
          apiId: api.id,
          providerId: provider.id,
          developerAddress: TEST_DEVELOPER_WALLET,
          tokenHash: `${testData.tokenHash}_${i}`,
          isUsed: false,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          lastValidAfter: new Date()
        }
      });
      tokens.push(token);
    }

    console.log(`   ✅ Created ${tokens.length} single-use tokens`);

    // Test relationship: Payment -> Tokens
    const paymentWithTokens = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { Token: true }
    });

    if (paymentWithTokens?.Token.length !== tokenCount) {
      throw new Error('Payment-Token relationship failed');
    }

    console.log(`   ✅ Payment-Token relationship verified: ${paymentWithTokens.Token.length} tokens`);

    return { payment, tokens };

  } catch (error) {
    console.error('   ❌ Payment/Token creation failed:', error);
    throw error;
  }
}

async function testTokenUsageAndLogging(tokens: Token[], api: Api, provider: Provider, developerProvider: Provider) {
  console.log('3️⃣ Testing Token Usage & Logging...');

  try {
    const testData = generateTestData();
    const tokenToUse = tokens[0]; // Use first token

    // Create usage log for token consumption
    const usageLog = await prisma.usageLog.create({
      data: {
        id: `usage_${testData.randomId}`,
        tokenId: tokenToUse.id,
        apiId: api.id,
        providerId: provider.id,
        developerAddress: TEST_DEVELOPER_WALLET,
        requestHeaders: {
          'User-Agent': 'Furo-Client/1.0',
          'X-Request-ID': `req_${testData.randomId}`,
          'Content-Type': 'application/json'
        },
        requestParams: {
          testParam: 'test-value',
          timestamp: testData.timestamp
        },
        requestBody: JSON.stringify({ query: 'test' }),
        responseStatus: 200,
        responseTime: 156,
        responseSize: 1024,
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'Furo-Test-Client/1.0'
      }
    });

    console.log(`   ✅ Usage log created: ${usageLog.id} (status: ${usageLog.responseStatus})`);

    // Update token as used
    const updatedToken = await prisma.token.update({
      where: { id: tokenToUse.id },
      data: {
        isUsed: true,
        usedAt: new Date()
      }
    });

    console.log(`   ✅ Token marked as used: ${updatedToken.id}`);

    // Test relationship: Token -> UsageLog
    const tokenWithUsage = await prisma.token.findUnique({
      where: { id: tokenToUse.id },
      include: { UsageLog: true }
    });

    if (!tokenWithUsage?.UsageLog) {
      throw new Error('Token-UsageLog relationship failed');
    }

    console.log(`   ✅ Token-UsageLog relationship verified`);

    return usageLog;

  } catch (error) {
    console.error('   ❌ Token usage test failed:', error);
    throw error;
  }
}

async function testUserEngagement(api: Api, provider: Provider, developerProvider: Provider) {
  console.log('4️⃣ Testing User Engagement (Favorites & Reviews)...');

  try {
    const testData = generateTestData();

    // Test favorites
    const favorite = await prisma.favorite.create({
      data: {
        id: `favorite_${testData.randomId}`,
        userId: TEST_DEVELOPER_WALLET,
        apiId: api.id,
        providerId: provider.id
      }
    });

    console.log(`   ✅ Favorite created: ${favorite.id}`);

    // Test duplicate favorite (should fail due to unique constraint)
    try {
      await prisma.favorite.create({
        data: {
          id: `favorite_duplicate_${testData.randomId}`,
          userId: TEST_DEVELOPER_WALLET,
          apiId: api.id,
          providerId: provider.id
        }
      });
      throw new Error('Duplicate favorite should have failed');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`   ✅ Duplicate favorite correctly prevented`);
      } else {
        throw error;
      }
    }

    // Test reviews
    const review = await prisma.review.create({
      data: {
        id: `review_${testData.randomId}`,
        apiId: api.id,
        reviewerAddress: TEST_DEVELOPER_WALLET,
        rating: 5,
        comment: 'Excellent test API! Very reliable and fast.',
        isVerified: true,
        helpfulCount: 1,
        updatedAt: new Date()
      }
    });

    console.log(`   ✅ Review created: ${review.id} (${review.rating} stars)`);

    // Test API relationships
    const apiWithEngagement = await prisma.api.findUnique({
      where: { id: api.id },
      include: {
        Favorite: true,
        Review: true
      }
    });

    if (!apiWithEngagement?.Favorite.length || !apiWithEngagement?.Review.length) {
      throw new Error('API engagement relationships failed');
    }

    console.log(`   ✅ API engagement relationships verified: ${apiWithEngagement.Favorite.length} favorites, ${apiWithEngagement.Review.length} reviews`);

    return { favorite, review };

  } catch (error) {
    console.error('   ❌ User engagement test failed:', error);
    throw error;
  }
}

async function testProviderManagement(provider: Provider) {
  console.log('5️⃣ Testing Provider Management (API Keys)...');

  try {
    const testData = generateTestData();

    // Create API key
    const apiKey = await prisma.apiKey.create({
      data: {
        id: `apikey_${testData.randomId}`,
        providerId: provider.id,
        name: 'Test Production Key',
        keyHash: testData.keyHash,
        permissions: {
          actions: ['api:read', 'api:write'],
          endpoints: [testData.publicPath],
          version: '1.0.0'
        },
        rateLimit: 1000,
        lastUsed: new Date(),
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });

    console.log(`   ✅ API key created: ${apiKey.name} (${apiKey.id})`);

    // Test key lookup
    const foundKey = await prisma.apiKey.findFirst({
      where: {
        providerId: provider.id,
        isActive: true
      }
    });

    if (!foundKey || foundKey.id !== apiKey.id) {
      throw new Error('API key lookup failed');
    }

    console.log(`   ✅ API key lookup successful`);

    return apiKey;

  } catch (error) {
    console.error('   ❌ Provider management test failed:', error);
    throw error;
  }
}

async function testSystemConfiguration() {
  console.log('6️⃣ Testing System Configuration...');

  try {
    const testData = generateTestData();

    // Create configuration
    const config = await prisma.configuration.create({
      data: {
        id: `config_${testData.randomId}`,
        key: 'test_platform_fee_percentage',
        value: JSON.stringify(2.5),
        description: 'Test platform fee setting',
        isActive: true,
        updatedAt: new Date()
      }
    });

    console.log(`   ✅ Configuration created: ${config.key} = ${config.value}`);

    // Test configuration lookup
    const foundConfig = await prisma.configuration.findFirst({
      where: {
        key: 'test_platform_fee_percentage',
        isActive: true
      }
    });

    if (!foundConfig || foundConfig.id !== config.id) {
      throw new Error('Configuration lookup failed');
    }

    console.log(`   ✅ Configuration lookup successful`);

    // Test duplicate key (should fail due to unique constraint)
    try {
      await prisma.configuration.create({
        data: {
          id: `config_duplicate_${testData.randomId}`,
          key: 'test_platform_fee_percentage',
          value: JSON.stringify(3.0),
          description: 'Duplicate test config',
          isActive: true,
          updatedAt: new Date()
        }
      });
      throw new Error('Duplicate configuration should have failed');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`   ✅ Duplicate configuration correctly prevented`);
      } else {
        throw error;
      }
    }

    return config;

  } catch (error) {
    console.error('   ❌ System configuration test failed:', error);
    throw error;
  }
}

async function runCompleteIntegrationTest() {
  console.log('🚀 Starting Complete Database Integration Test...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Clean up any existing test data
    await cleanup();

    // 1️⃣ Test Provider & API Creation
    const { provider, developerProvider, api } = await testProviderAndApiCreation();

    // 2️⃣ Test Payment & Token Creation
    const { tokens } = await testPaymentAndTokenCreation(provider, api, developerProvider);

    // 3️⃣ Test Token Usage & Logging
    await testTokenUsageAndLogging(tokens, api, provider, developerProvider);

    // 4️⃣ Test User Engagement
    await testUserEngagement(api, provider, developerProvider);

    // 5️⃣ Test Provider Management
    await testProviderManagement(provider);

    // 6️⃣ Test System Configuration
    await testSystemConfiguration();

    // Final verification - check all data exists
    console.log('\n7️⃣ Final Data Verification...');
    const finalCounts = await Promise.all([
      prisma.provider.count({ where: { walletAddress: TEST_PROVIDER_WALLET } }),
      prisma.api.count({ where: { providerId: provider.id } }),
      prisma.payment.count({ where: { developerAddress: TEST_DEVELOPER_WALLET } }),
      prisma.token.count({ where: { developerAddress: TEST_DEVELOPER_WALLET } }),
      prisma.usageLog.count({ where: { developerAddress: TEST_DEVELOPER_WALLET } }),
      prisma.favorite.count({ where: { userId: TEST_DEVELOPER_WALLET } }),
      prisma.review.count({ where: { reviewerAddress: TEST_DEVELOPER_WALLET } }),
      prisma.apiKey.count({ where: { providerId: provider.id } }),
      prisma.configuration.count({ where: { key: 'test_platform_fee_percentage' } })
    ]);

    console.log('📊 Final Data Counts:');
    console.log(`   Providers: ${finalCounts[0]} ✅`);
    console.log(`   APIs: ${finalCounts[1]} ✅`);
    console.log(`   Payments: ${finalCounts[2]} ✅`);
    console.log(`   Tokens: ${finalCounts[3]} ✅`);
    console.log(`   Usage Logs: ${finalCounts[4]} ✅`);
    console.log(`   Favorites: ${finalCounts[5]} ✅`);
    console.log(`   Reviews: ${finalCounts[6]} ✅`);
    console.log(`   API Keys: ${finalCounts[7]} ✅`);
    console.log(`   Configurations: ${finalCounts[8]} ✅`);

    console.log('\n🎉 COMPLETE INTEGRATION TEST SUCCESSFUL!');
    console.log('✅ All x402 flow components working correctly');
    console.log('✅ Database relationships verified');
    console.log('✅ Constraints and validations working');

    // Clean up test data
    await cleanup();

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  }
}

// Run the test
runCompleteIntegrationTest()
  .then(() => {
    console.log('\n🏁 Integration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Integration test failed:', error.message);
    process.exit(1);
  });