/**
 * Quick x402 Test Script
 * Run this with: node test/quick-x402-test.js
 */

const config = {
  baseUrl: 'http://localhost:3000', // Update if your server runs elsewhere
  testApiId: 'api_1234567890', // Update to a real API ID from your database
  developerAddress: '0x...', // Update to your wallet address
};

async function test402Response() {
  console.log('🧪 Testing 402 Payment Required Response...\n');

  try {
    const response = await fetch(`${config.baseUrl}/api/apis/${config.testApiId}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Developer-Address': config.developerAddress,
      },
      body: JSON.stringify({
        params: {},
        headers: {},
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 402) {
      const data = await response.json();
      console.log('✅ 402 Payment Required - Perfect!');
      console.log('\nPayment Details:');
      console.log('- Amount:', data.payment?.amount || 'N/A');
      console.log('- To:', data.payment?.address || 'N/A');
      console.log('- Network:', data.payment?.network || 'N/A');
      console.log('- Currency:', data.payment?.currency || 'N/A');

      console.log('\n💡 Next Steps:');
      console.log('1. Open your browser and go to your API details page');
      console.log('2. Connect your wallet with Sepolia test ETH');
      console.log('3. Click "Pay & Call API"');
      console.log('4. Complete the transaction in MetaMask/your wallet');
      console.log('5. The transaction should be verified on-chain automatically!');

      return true;
    } else {
      const data = await response.text();
      console.log('❌ Expected 402 status, but got:', response.status);
      console.log('Response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testEnvironment() {
  console.log('🔍 Testing Environment...\n');

  try {
    const response = await fetch(`${config.baseUrl}/api/providers`);
    console.log(`✅ Server is running at: ${config.baseUrl}`);
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to server:', error.message);
    console.log('\nMake sure your development server is running:');
    console.log('  pnpm dev');
    return false;
  }
}

async function main() {
  console.log('🚀 Quick x402 Flow Test');
  console.log('========================\n');

  // Check if server is running
  const serverOk = await testEnvironment();
  if (!serverOk) {
    console.log('\n❌ Please start your development server first');
    return;
  }

  // Test 402 response
  const testOk = await test402Response();

  if (testOk) {
    console.log('\n🎉 x402 flow is ready for manual testing!');
    console.log('\nTo complete the full test:');
    console.log('1. Update the config in this file with your wallet address');
    console.log('2. Update testApiId to a real API from your database');
    console.log('3. Run the test again to verify 402 response');
    console.log('4. Then test the full flow in your browser');
  } else {
    console.log('\n❌ Please check your API implementation');
  }
}

// Check configuration
if (config.testApiId === 'api_1234567890' || config.developerAddress === '0x...') {
  console.log('⚠️  Please update the configuration in this file first:');
  console.log('   - testApiId: Get a real API ID from your database');
  console.log('   - developerAddress: Add your wallet address');
  console.log('   - baseUrl: Update if your server runs on a different port\n');
} else {
  main().catch(console.error);
}