import React from 'react';
import Head from 'next/head';
import { X } from 'lucide-react';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const KycBadge = dynamic(() => import('../components/KycBadge'), { ssr: false });

// Load header client-only to avoid SSR hydration mismatch
const HeaderClient = dynamic(() => import('../components/HeaderClient'), { ssr: false });

export default function Home() {
  const { address, isConnected } = useAccount();
  const [kycRefreshKey] = React.useState(0);

  // submitting state handled in global KYC modal

  return (
    <>
      <Head>
        <title>Tokenized Asset Management Platform - STONKS</title>
        <meta name="description" content="Tokenized Asset Management Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-bold text-gray-900">
                  Tokenized Asset Management Platform - STONKS
                </h1>
                <HeaderClient address={address} kycRefreshKey={kycRefreshKey} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to STONKS
            </h2>
            <p className="text-gray-600 mb-6">
              Tokenized Asset Management Platform
            </p>
            {isConnected && address && (
              <div className="bg-white rounded-lg p-6 shadow-sm inline-block">
                <p className="text-sm text-gray-600 mb-2">Connected Wallet:</p>
                <p className="font-mono text-sm text-gray-900">{address}</p>
                  <KycBadge address={address} refreshKey={kycRefreshKey} />
              </div>
            )}
            {/* Market Place button centered under wallet info */}
            <div className="mt-8">
              <Link
                href="/marketplace"
                className="inline-block px-8 py-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors text-2xl font-semibold"
              >
                Market Place
              </Link>
            </div>
          </div>
        </main>

  {/* global KYC modal moved to _app.tsx */}
      </div>
    </>
  );
}
