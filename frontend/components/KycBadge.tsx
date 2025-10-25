"use client";

import React, { useEffect, useState } from 'react';
import { apiService } from '../lib/api';

type KycStatus = 'approved' | 'rejected' | 'pending' | string;

export default function KycBadge({ address, refreshKey }: { address?: string | null; refreshKey?: number }) {
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  useEffect(() => {
    if (!address) return;
    let mounted = true;

    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getKycStatus(address);
        if (!mounted) return;
        setStatus(data.kycStatus || (data.isBlacklisted ? 'rejected' : data.isWhitelisted ? 'approved' : 'pending'));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (mounted) setError(msg || 'failed');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (!address) return null;

    fetchStatus();
    return () => {
      mounted = false;
    };
  }, [address, refreshKey]);

  const title =
    status === 'approved'
      ? 'You are whitelisted'
      : status === 'rejected'
      ? 'You are blacklisted — please contact support'
      : 'Please submit KYC';

  const color = status === 'approved' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-600' : 'bg-orange-400';

  return (
    <div className="inline-block ml-3">
      <div className="relative group">
        <button
          onClick={async (e) => {
            e.preventDefault();
            if (!address) return;
            if (cooldown) return;
            setCooldown(true);
            setLoading(true);
            setError(null);
            try {
              const data = await apiService.getKycStatus(address);
              setStatus(data.kycStatus || (data.isBlacklisted ? 'rejected' : data.isWhitelisted ? 'approved' : 'pending'));
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              setError(msg || 'failed');
            } finally {
              setLoading(false);
              setTimeout(() => setCooldown(false), 1000);
            }
          }}
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${color} border-2 border-white dark:border-gray-900 cursor-pointer ${cooldown ? 'opacity-70' : ''}`}
          aria-label={`kyc-status-${status}`}
          title={error ? `Error: ${error}` : title}
        >
          {loading ? (
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="w-2 h-2 rounded-full" />
          )}
        </button>

        <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 z-50">
          {loading ? 'Checking...' : error ? `Error: ${error}` : title}
        </div>
      </div>
    </div>
  );
}
