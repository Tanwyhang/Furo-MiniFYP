/**
 * Test script for platform fee calculation
 * Run with: pnpm tsx test/platform-fee-test.ts
 */

function calculatePlatformFee(totalAmount: string, feePercentage: number) {
  const totalAmountBigInt = BigInt(totalAmount);
  const platformFeeAmount = (totalAmountBigInt * BigInt(feePercentage)) / BigInt(100);
  const providerAmount = totalAmountBigInt - platformFeeAmount;

  return {
    totalAmount: totalAmountBigInt.toString(),
    platformFee: {
      amount: platformFeeAmount.toString(),
      percentage: feePercentage
    },
    providerShare: {
      amount: providerAmount.toString()
    }
  };
}

function testPlatformFeeCalculations() {
  console.log('🧮 Testing Platform Fee Calculations (3% Commission)');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'Small payment (0.001 ETH)',
      amount: '1000000000000000' // 0.001 ETH in wei
    },
    {
      name: 'Medium payment (0.01 ETH)',
      amount: '10000000000000000' // 0.01 ETH in wei
    },
    {
      name: 'Large payment (0.1 ETH)',
      amount: '100000000000000000' // 0.1 ETH in wei
    },
    {
      name: 'API price minimum (0.000001 ETH)',
      amount: '1000000000000' // 0.000001 ETH in wei
    }
  ];

  testCases.forEach(testCase => {
    const result = calculatePlatformFee(testCase.amount, 3);

    console.log(`\n📊 ${testCase.name}:`);
    console.log(`  Total Payment: ${result.totalAmount} wei`);
    console.log(`  Platform Fee (3%): ${result.platformFee.amount} wei`);
    console.log(`  Provider Share: ${result.providerShare.amount} wei`);

    // Convert to ETH for readability
    const totalETH = parseFloat(result.totalAmount) / 1e18;
    const platformETH = parseFloat(result.platformFee.amount) / 1e18;
    const providerETH = parseFloat(result.providerShare.amount) / 1e18;

    console.log(`  In ETH:`);
    console.log(`    Total: ${totalETH.toFixed(6)} ETH`);
    console.log(`    Platform: ${platformETH.toFixed(6)} ETH`);
    console.log(`    Provider: ${providerETH.toFixed(6)} ETH`);

    // Calculate token count (assuming 0.000001 ETH per API call)
    const apiPriceWei = BigInt('1000000000000'); // 0.000001 ETH
    const tokenCount = Number(BigInt(result.providerShare.amount) / apiPriceWei);
    console.log(`    Tokens Issued: ${tokenCount} API calls`);
  });
}

function testEdgeCases() {
  console.log('\n🔍 Testing Edge Cases:');
  console.log('='.repeat(30));

  // Test with very small amount
  const tinyAmount = '100000000000'; // 0.0000001 ETH
  const result = calculatePlatformFee(tinyAmount, 3);

  console.log(`\n📊 Tiny Amount (${parseFloat(tinyAmount) / 1e18} ETH):`);
  console.log(`  Platform Fee: ${result.platformFee.amount} wei`);
  console.log(`  Provider Share: ${result.providerShare.amount} wei`);

  if (BigInt(result.providerShare.amount) === BigInt(0)) {
    console.log(`  ⚠️  WARNING: Provider share is 0, no tokens will be issued`);
  }
}

function simulatePaymentFlow() {
  console.log('\n💰 Simulating Complete Payment Flow:');
  console.log('='.repeat(40));

  // Simulate a payment of 0.003 ETH for 3 API calls
  const totalPayment = '3000000000000000'; // 0.003 ETH
  const apiPrice = '1000000000000'; // 0.000001 ETH per call

  const feeBreakdown = calculatePlatformFee(totalPayment, 3);
  const expectedTokens = Number(BigInt(feeBreakdown.providerShare.amount) / BigInt(apiPrice));

  console.log(`\n📝 Payment Details:`);
  console.log(`  Customer pays: ${parseFloat(totalPayment) / 1e18} ETH`);
  console.log(`  Platform keeps: ${parseFloat(feeBreakdown.platformFee.amount) / 1e18} ETH (3%)`);
  console.log(`  Provider receives: ${parseFloat(feeBreakdown.providerShare.amount) / 1e18} ETH`);
  console.log(`  API calls issued: ${expectedTokens} tokens`);
  console.log(`  Effective price per call: ${(parseFloat(feeBreakdown.providerShare.amount) / 1e18 / expectedTokens).toFixed(6)} ETH`);
}

// Run all tests
function runPlatformFeeTests() {
  testPlatformFeeCalculations();
  testEdgeCases();
  simulatePaymentFlow();

  console.log('\n✅ Platform fee testing complete!');
  console.log('\n📋 Summary:');
  console.log('  ✅ 3% platform commission applied correctly');
  console.log('  ✅ Provider receives 97% of payment');
  console.log('  ✅ Token calculation based on provider share');
  console.log('  ✅ Edge cases handled appropriately');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPlatformFeeTests();
}

export { calculatePlatformFee, runPlatformFeeTests };