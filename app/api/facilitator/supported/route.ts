import { NextResponse } from 'next/server';

// GET /api/facilitator/supported - Get supported networks and configurations
export async function GET() {
  try {
    const supportedNetworks = [
      {
        name: 'sepolia',
        displayName: 'Ethereum Sepolia',
        chainId: 11155111,
        currency: 'ETH',
        testnet: true,
        rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
        explorerUrl: 'https://sepolia.etherscan.io',
        faucetUrl: 'https://sepoliafaucet.com/',
        status: 'active'
      },
      {
        name: 'mainnet',
        displayName: 'Ethereum Mainnet',
        chainId: 1,
        currency: 'ETH',
        testnet: false,
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        explorerUrl: 'https://etherscan.io',
        faucetUrl: null,
        status: 'coming_soon'
      }
    ];

    const facilitatorConfig = {
      name: 'Furo x402 Facilitator',
      version: '1.0.0',
      description: 'Custom x402 facilitator for Furo API marketplace',
      supportedNetworks: supportedNetworks.map(n => n.name),
      features: [
        'payment_verification',
        'settlement',
        'token_issuance',
        'multi_network_support'
      ],
      endpoints: {
        verify: '/api/facilitator/verify',
        settle: '/api/facilitator/settle',
        supported: '/api/facilitator/supported'
      },
      limits: {
        minPaymentAmount: '0.000001', // 1 gwei
        maxPaymentAmount: '10', // 10 ETH
        tokenExpiryHours: 24,
        maxRetries: 3
      }
    };

    return NextResponse.json({
      success: true,
      facilitator: facilitatorConfig,
      networks: supportedNetworks,
      usage: {
        verification: {
          method: 'POST',
          endpoint: '/api/facilitator/verify',
          requiredFields: ['transactionHash', 'expectedAmount', 'recipientAddress'],
          optionalFields: ['network', 'sessionId', 'resourceId', 'developerAddress']
        },
        settlement: {
          method: 'POST',
          endpoint: '/api/facilitator/settle',
          requiredFields: ['paymentId', 'providerAddress', 'amount'],
          optionalFields: ['currency', 'network', 'sessionId', 'developerAddress', 'resourceId']
        }
      }
    });

  } catch (error) {
    console.error('Error getting supported networks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get supported networks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}