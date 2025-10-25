"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { AppKitConnectButton } from '@reown/appkit/react';
import { KycContext } from '../context/KycContext';

const KycBadge = dynamic(() => import('./KycBadge'), { ssr: false });

export default function HeaderClient({ onOpenKyc, address, kycRefreshKey }: { onOpenKyc?: () => void; address?: string; kycRefreshKey?: number }) {
  const ctx = React.useContext(KycContext);
  const open = onOpenKyc ?? ctx?.openKyc ?? (() => {});

  return (
    <div className="flex gap-4 items-center">
      <button
        onClick={open}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        KYC
      </button>

      {address && <KycBadge address={address} refreshKey={kycRefreshKey || ctx?.refreshKey || 0} />}

      <AppKitConnectButton />
    </div>
  );
}
