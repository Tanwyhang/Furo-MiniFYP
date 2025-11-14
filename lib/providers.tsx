'use client';

import { useMemo, useState, type ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: "Furo API Marketplace",
        projectId: projectId || 'default-project-id',
        chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
        ssr: false,
      }),
    [projectId],
  );

  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}