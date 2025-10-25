import { createConfig, http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

let _config: ReturnType<typeof createConfig> | null = null;
let _appKit: ReturnType<typeof createAppKit> | null = null;

const chains = [sepolia, mainnet] as const;

export function getWagmiConfig() {
  if (_config) return _config;
  _config = createConfig({
    chains,
    transports: {
      [sepolia.id]: http(),
      [mainnet.id]: http(),
    },
  });
  return _config;
}

export function getAppKit() {
  if (_appKit) return _appKit;

  const wagmiAdapter = new WagmiAdapter({
    networks: [sepolia, mainnet],
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  });

  _appKit = createAppKit({
    adapters: [wagmiAdapter],
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    networks: [sepolia, mainnet],
    metadata: {
      name: 'STONKS - Tokenized Asset Management Platform',
      description: 'Tokenized Asset Management Platform',
      url: 'https://stonks-platform.com',
      icons: ['https://avatars.githubusercontent.com/u/37784886'],
    },
  });

  return _appKit;
}
