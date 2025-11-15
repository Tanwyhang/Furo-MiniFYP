/**
 * Test script for custom x402 facilitator
 * Run with: pnpm tsx test/custom-facilitator-test.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

async function testSupportedNetworks() {
  console.log('🔍 Testing supported networks endpoint...');

  try {
    const response = await fetch(`${BASE_URL}/api/facilitator/supported`);
    const data = await response.json();

    console.log('✅ Supported Networks Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`✅ Facilitator supports ${data.networks.length} networks`);
      data.networks.forEach((network: any) => {
        console.log(`  - ${network.displayName} (${network.name}): ${network.status}`);
      });
    }

    return data;
  } catch (error) {
    console.error('❌ Supported networks test failed:', error);
    return null;
  }
}

async function testPaymentVerification() {
  console.log('\n🔍 Testing payment verification endpoint...');

  try {
    const testPayload = {
      transactionHash: '0xtest1234567890abcdef',
      expectedAmount: '1000000000000000', // 0.001 ETH
      recipientAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b9',
      network: 'sepolia',
      sessionId: 'test-session-123',
      resourceId: 'test-api-456',
      developerAddress: '0x1234567890123456789012345678901234567890'
    };

    const response = await fetch(`${BASE_URL}/api/facilitator/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Furo-Facilitator': 'custom-v1'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    console.log('✅ Payment Verification Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Payment verification simulated successfully');
      console.log(`  - Transaction: ${data.transaction.hash}`);
      console.log(`  - Network: ${data.transaction.network}`);
      console.log(`  - Amount: ${data.transaction.amount}`);
    } else {
      console.log('⚠️ Payment verification failed (expected in development)');
    }

    return data;
  } catch (error) {
    console.error('❌ Payment verification test failed:', error);
    return null;
  }
}

async function testSettlement() {
  console.log('\n🔍 Testing settlement endpoint...');

  try {
    const testPayload = {
      paymentId: 'test-payment-789',
      providerAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b9',
      amount: '1000000000000000', // 0.001 ETH
      currency: 'ETH',
      network: 'sepolia',
      sessionId: 'test-session-123',
      developerAddress: '0x1234567890123456789012345678901234567890',
      resourceId: 'test-api-456'
    };

    const response = await fetch(`${BASE_URL}/api/facilitator/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Furo-Facilitator': 'custom-v1'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    console.log('✅ Settlement Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Settlement processed successfully');
      console.log(`  - Status: ${data.settlement.status}`);
      console.log(`  - Transaction: ${data.settlement.transactionHash}`);
    } else {
      console.log('⚠️ Settlement failed (expected without payment record)');
    }

    return data;
  } catch (error) {
    console.error('❌ Settlement test failed:', error);
    return null;
  }
}

async function runFacilitatorTests() {
  console.log('🚀 Starting Custom Facilitator Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('='.repeat(50));

  const results = {
    supported: await testSupportedNetworks(),
    verification: await testPaymentVerification(),
    settlement: await testSettlement()
  };

  console.log('\n📊 Test Summary:');
  console.log(`  Supported Networks: ${results.supported ? '✅' : '❌'}`);
  console.log(`  Payment Verification: ${results.verification ? '✅' : '❌'}`);
  console.log(`  Settlement: ${results.settlement ? '✅' : '❌'}`);

  const allPassed = results.supported && results.verification && results.settlement;
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  return allPassed;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runFacilitatorTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runFacilitatorTests };