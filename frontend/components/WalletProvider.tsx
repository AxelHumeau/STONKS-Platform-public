'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { getWagmiConfig, getAppKit } from '../lib/web3Config';

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const config = getWagmiConfig();
  getAppKit();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
