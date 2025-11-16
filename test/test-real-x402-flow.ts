/**
 * Real x402 Flow Test Script
 *
 * This script tests the complete real x402 payment flow with actual Web3 transactions
 * on Sepolia testnet. It verifies:
 *
 * 1. 402 Payment Required response
 * 2. Real Web3 transaction signing
 * 3. On-chain transaction verification
 * 4. Token issuance
 * 5. Transaction history
 */

import { createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains';

// Test configuration
const TEST_CONFIG = {
  // Update this to your local dev server
  baseUrl: 'http://localhost:3000',
  testApiId: 'test-api-1', // You'll need to create a test API first
  testDeveloperAddress: '0x...', // Your test wallet address
  testProviderAddress: '0x...', // Your test provider wallet address
  testAmount: '100000000000000', // 0.0001 ETH in wei
  network: 'sepolia'
};

// Public client for checking transactions
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

async function test402Response() {
  console.log('🧪 Test 1: Testing 402 Payment Required Response');
  console.log('=' .repeat(60));

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/apis/${TEST_CONFIG.testApiId}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Developer-Address': TEST_CONFIG.testDeveloperAddress,
      },
      body: JSON.stringify({
        params: {},
        headers: {},
      }),
    });

    if (response.status === 402) {
      const data = await response.json();
      console.log('✅ 402 Payment Required response received');
      console.log('💰 Payment details:', {
        amount: data.payment.amount,
        address: data.payment.address,
        network: data.payment.network,
        currency: data.payment.currency
      });
      return data;
    } else {
      console.log('❌ Expected 402 status, got:', response.status);
      console.log('Response:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
}

async function testTransactionVerification(transactionHash: string) {
  console.log('\n🧪 Test 2: Testing On-Chain Transaction Verification');
  console.log('=' .repeat(60));

  try {
    // Check if transaction exists on blockchain
    const transaction = await publicClient.getTransaction({
      hash: transactionHash as `0x${string}`
    });

    if (!transaction) {
      console.log('❌ Transaction not found on blockchain');
      return false;
    }

    console.log('✅ Transaction found on blockchain');
    console.log('📝 Transaction details:', {
      from: transaction.from,
      to: transaction.to,
      value: formatEther(transaction.value),
      gasPrice: transaction.gasPrice ? formatEther(transaction.gasPrice) : 'N/A'
    });

    // Check transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`
    });

    if (!receipt) {
      console.log('❌ Transaction receipt not found');
      return false;
    }

    console.log('✅ Transaction receipt found');
    console.log('📊 Receipt details:', {
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    });

    return receipt.status === 'success';
  } catch (error) {
    console.error('❌ Transaction verification failed:', error);
    return false;
  }
}

async function testPaymentProcessing(transactionHash: string) {
  console.log('\n🧪 Test 3: Testing Payment Processing API');
  console.log('=' .repeat(60));

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionHash,
        apiId: TEST_CONFIG.testApiId,
        developerAddress: TEST_CONFIG.testDeveloperAddress,
        paymentAmount: TEST_CONFIG.testAmount,
        currency: 'ETH',
        network: TEST_CONFIG.network
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Payment processing successful');
      console.log('💳 Payment details:', {
        paymentId: data.data.payment?.id,
        isVerified: data.data.payment?.isVerified,
        tokensIssued: data.data.tokens?.length || 0
      });

      if (data.data.tokens && data.data.tokens.length > 0) {
        console.log('🎫 Tokens issued:', data.data.tokens.map((token: any) => ({
          tokenHash: token.tokenHash,
          expiresAt: token.expiresAt
        })));
      }

      return data;
    } else {
      console.log('❌ Payment processing failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Payment processing test failed:', error);
    return null;
  }
}

async function testTransactionHistory(developerAddress: string) {
  console.log('\n🧪 Test 4: Testing Transaction History');
  console.log('=' .repeat(60));

  try {
    const response = await fetch(
      `${TEST_CONFIG.baseUrl}/api/payments/history?developerAddress=${developerAddress}`
    );

    const data = await response.json();

    if (data.success) {
      console.log('✅ Transaction history retrieved');
      console.log(`📊 Found ${data.data.length} transactions`);

      data.data.forEach((tx: any, index: number) => {
        console.log(`  ${index + 1}. ${tx.apiName || 'Unknown API'} - ${formatEther(BigInt(tx.amount))} ETH - ${tx.isVerified ? '✅ Verified' : '❌ Pending'}`);
      });

      return data;
    } else {
      console.log('❌ Transaction history retrieval failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Transaction history test failed:', error);
    return null;
  }
}

async function runFullTest() {
  console.log('🚀 Starting Real x402 Flow Test on Sepolia');
  console.log('📍 Base URL:', TEST_CONFIG.baseUrl);
  console.log('=' .repeat(80));

  // Test 1: Get 402 response
  const paymentResponse = await test402Response();
  if (!paymentResponse) {
    console.log('\n❌ Test failed at 402 response stage');
    return;
  }

  console.log('\n💡 Manual Testing Required');
  console.log('=' .repeat(60));
  console.log('To complete the test, you need to:');
  console.log('1. Open your browser to:', TEST_CONFIG.baseUrl);
  console.log('2. Connect your wallet (with Sepolia test ETH)');
  console.log('3. Navigate to an API details page');
  console.log('4. Click "Pay & Call API"');
  console.log('5. Complete the real Web3 transaction in your wallet');
  console.log('6. Copy the transaction hash from the success message');
  console.log('7. Replace the transactionHash below and run the remaining tests');

  // Skip the remaining tests for now since they require manual interaction
  console.log('\n⏭️ Skipping remaining tests (require manual transaction)');

  // Uncomment the following once you have a real transaction hash:
  /*
  // Test 2: Verify transaction on blockchain
  const isValidTransaction = await testTransactionVerification('YOUR_TX_HASH_HERE');
  if (!isValidTransaction) {
    console.log('\n❌ Test failed at transaction verification stage');
    return;
  }

  // Test 3: Test payment processing
  const paymentResult = await testPaymentProcessing('YOUR_TX_HASH_HERE');
  if (!paymentResult) {
    console.log('\n❌ Test failed at payment processing stage');
    return;
  }

  // Test 4: Test transaction history
  const historyResult = await testTransactionHistory(TEST_CONFIG.testDeveloperAddress);
  if (!historyResult) {
    console.log('\n❌ Test failed at transaction history stage');
    return;
  }

  console.log('\n🎉 All tests passed! Real x402 flow is working correctly.');
  */
}

// Pre-flight checks
function checkEnvironment() {
  console.log('🔍 Environment Checks');
  console.log('=' .repeat(60));

  const issues = [];

  if (!TEST_CONFIG.baseUrl || TEST_CONFIG.baseUrl === 'http://localhost:3000') {
    issues.push('Update TEST_CONFIG.baseUrl to your running server');
  }

  if (!TEST_CONFIG.testApiId || TEST_CONFIG.testApiId === 'test-api-1') {
    issues.push('Update TEST_CONFIG.testApiId to a real API ID');
  }

  if (!TEST_CONFIG.testDeveloperAddress || TEST_CONFIG.testDeveloperAddress === '0x...') {
    issues.push('Update TEST_CONFIG.testDeveloperAddress to your wallet address');
  }

  if (!TEST_CONFIG.testProviderAddress || TEST_CONFIG.testProviderAddress === '0x...') {
    issues.push('Update TEST_CONFIG.testProviderAddress to a provider wallet address');
  }

  if (issues.length > 0) {
    console.log('❌ Configuration issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('\nPlease update the configuration and run again.');
    return false;
  }

  console.log('✅ Environment looks good!');
  return true;
}

// Run the tests
if (checkEnvironment()) {
  runFullTest().catch(console.error);
} else {
  console.log('\n🔧 Please fix the configuration issues before testing.');
}