'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const walletConnectProjectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!walletConnectProjectId) {
  throw new Error(
    'NEXT_PUBLIC_PROJECT_ID is required for WalletConnect. Create a project at https://cloud.walletconnect.com and set NEXT_PUBLIC_PROJECT_ID in .env.local.'
  );
}

const config = getDefaultConfig({
  appName: 'Furo API Marketplace',
  projectId: walletConnectProjectId,
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
  ssr: false,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}