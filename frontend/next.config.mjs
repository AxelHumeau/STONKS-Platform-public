/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    NEXT_PUBLIC_CONTRACT_FUND: process.env.NEXT_PUBLIC_CONTRACT_FUND,
    NEXT_PUBLIC_CONTRACT_NFT: process.env.NEXT_PUBLIC_CONTRACT_NFT,
    NEXT_PUBLIC_CONTRACT_KYC: process.env.NEXT_PUBLIC_CONTRACT_KYC,
    NEXT_PUBLIC_CONTRACT_ORACLE: process.env.NEXT_PUBLIC_CONTRACT_ORACLE,
    NEXT_PUBLIC_UNISWAP_ROUTER: process.env.NEXT_PUBLIC_UNISWAP_ROUTER,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
