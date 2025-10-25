import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { apiService } from '../lib/api';
import Link from 'next/link';
import { useRouter } from 'next/router';

const HeaderClient = dynamic(() => import('../components/HeaderClient'), { ssr: false });
import TransactionTable from '../components/TransactionTable';

export default function Marketplace() {
  const router = useRouter();
  const view = String(router.query?.view || '');
  const currentPageParam = Number(router.query?.page || 1);
  const currentPage = Number.isFinite(currentPageParam) && currentPageParam > 0 ? currentPageParam : 1;
  const { address } = useAccount();
  const [stats, setStats] = React.useState<any>(null);
  const [recentTransfers, setRecentTransfers] = React.useState<any[]>([]);
  const [oraclePrice, setOraclePrice] = React.useState<any>(null);
  const [oracleHistory, setOracleHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  // subpage state
  const [viewItems, setViewItems] = React.useState<any[]>([]);
  const [viewLoading, setViewLoading] = React.useState(false);
  const [viewTotalScanned, setViewTotalScanned] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    let timer: any = null;

    const load = async () => {
      try {
        // fetch stats first so we can decide how many recent events to request
        const s = await apiService.getEventsStats();

        let limit = s?.totalTransfers > 100 ? 100 : s?.totalTransfers;

        const [r, p, h] = await Promise.all([
          apiService.getRecentEvents(limit, 'transfer'),
          apiService.getOraclePrice(),
          apiService.getOracleHistory(1, 5)
        ]);

        if (!mounted) return;
        setStats(s);
        setRecentTransfers(r.events || []);
        setOraclePrice(p);
        setOracleHistory(h.prices || []);
      } catch (err) {
        console.error('Failed to load marketplace data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // initial load
    load();
    // poll every 10 seconds
    timer = window.setInterval(load, 10000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  // Load subpage items when view param is present
  React.useEffect(() => {
    let mounted = true;
    let timer: any = null;
    if (!view) return;

    const loadView = async () => {
      try {
        setViewLoading(true);
        // determine limit from stats.totalTransfers (use raw number as requested)
        const raw = Number(stats?.totalTransfers ?? 50);
        const limit = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 50;
        const res = await apiService.getRecentEvents(limit, 'transfer');
        if (!mounted) return;
        const events = res.events || [];
        setViewTotalScanned(events.length);

        let filtered = events;
        if (view === 'erc20') filtered = events.filter((e: any) => e.tokenType === 'ERC20');
        else if (view === 'erc721') filtered = events.filter((e: any) => e.tokenType === 'ERC721');
        else if (view === 'my' && address) {
          const lower = address.toLowerCase();
          filtered = events.filter((e: any) => (e.from && e.from.toLowerCase() === lower) || (e.to && e.to.toLowerCase() === lower));
        }

        setViewItems(filtered || []);
      } catch (err) {
        console.error('Failed to load view items', err);
      } finally {
        if (mounted) setViewLoading(false);
      }
    };

    // initial load and poll
    loadView();
    timer = window.setInterval(loadView, 15000);

    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [view, address, stats]);

  const erc20 = recentTransfers.filter(t => t.tokenType === 'ERC20').slice(0, 3);
  const erc721 = recentTransfers.filter(t => t.tokenType === 'ERC721').slice(0, 3);

  // My transfers
  const [myTransfers, setMyTransfers] = React.useState<any[]>([]);
  const [loadingMy, setLoadingMy] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    let timer: any = null;
    if (!address) {
      setMyTransfers([]);
      return () => { mounted = false; };
    }

    const loadMy = async () => {
      try {
        setLoadingMy(true);
        const raw = Number(stats?.totalTransfers ?? 50);
        const limit = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 50;
        const res = await apiService.getRecentEvents(limit, 'transfer');
        if (!mounted) return;
        const lower = address.toLowerCase();
        const filtered = (res.events || []).filter((ev: any) => {
          try {
            return (ev.from && ev.from.toLowerCase() === lower) || (ev.to && ev.to.toLowerCase() === lower);
          } catch (e) { return false; }
        });
        setMyTransfers(filtered || []);
      } catch (err) {
        console.error('Failed to load my transfers', err);
      } finally {
        if (mounted) setLoadingMy(false);
      }
    };

    loadMy();
    timer = window.setInterval(loadMy, 15000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [address, stats]);

  return (
    <>
      <Head>
        <title>Market Place</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-bold text-gray-900">Market Place</h1>
              <HeaderClient address={address} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* no embedded sub-pages here; use the dedicated /transactions page for full listings */}
          {/* Stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow text-center">
              <div className="text-sm text-gray-500">Total Transfers</div>
              <div className="text-2xl font-bold">{loading ? '—' : stats?.totalTransfers ?? '0'}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow text-center">
              <div className="text-sm text-gray-500">Total KYC</div>
              <div className="text-2xl font-bold">{loading ? '—' : stats?.totalKycEvents ?? '0'}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow text-center">
              <div className="text-sm text-gray-500">Oracle Updates</div>
              <div className="text-2xl font-bold">{loading ? '—' : stats?.totalOracleUpdates ?? '0'}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow text-center">
              <div className="text-sm text-gray-500">Transfers (last 24h)</div>
              <div className="text-2xl font-bold">{loading ? '—' : stats?.last24h?.transfers ?? '0'}</div>
            </div>
          </section>

          {/* Transaction previews + Oracle */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow flex flex-col">
              <h3 className="text-lg font-semibold mb-1">ERC20 Transfers</h3>
              <div className="text-xs text-gray-400 mb-3">latest</div>
              {loading ? (
                <div>Loading...</div>
              ) : erc20.length === 0 ? (
                <div className="text-sm text-gray-500">No ERC20 transfers in recent events</div>
              ) : (
                <ul className="space-y-3">
                  {erc20.map(t => (
                    <li key={t.id} className="flex justify-between items-center border p-3 rounded">
                      <div className="min-w-0">
                        <div className="font-mono text-sm truncate">{t.txHash}</div>
                        <div className="text-xs text-gray-500 mt-1">{t.amount} {t.tokenSymbol}</div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">{new Date(t.timestamp).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
                <div className="mt-4 text-right mt-auto">
                <Link href="/transactions?view=erc20" className="text-sm text-blue-600 hover:underline">Show more →</Link>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow flex flex-col">
              <h3 className="text-lg font-semibold mb-1">ERC721 Transfers (NFT)</h3>
              <div className="text-xs text-gray-400 mb-3">latest</div>
              {loading ? (
                <div>Loading...</div>
              ) : erc721.length === 0 ? (
                <div className="text-sm text-gray-500">No ERC721 transfers in recent events</div>
              ) : (
                <ul className="space-y-3">
                  {erc721.map(t => (
                    <li key={t.id} className="flex justify-between items-center border p-3 rounded">
                      <div className="min-w-0">
                        <div className="font-mono text-sm truncate">{t.txHash}</div>
                        <div className="text-xs text-gray-500 mt-1">Token ID: {t.tokenId}</div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">{new Date(t.timestamp).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 text-right mt-auto">
                <Link href="/transactions?view=erc721" className="text-sm text-blue-600 hover:underline">Show more →</Link>
              </div>
            </div>

            {/* Oracle card (third column on large screens) */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold mb-4">Oracle</h3>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div>
                  <div className="text-sm text-gray-500">Current Price</div>
                  <div className="text-2xl font-bold">{oraclePrice?.price != null ? (Number(oraclePrice.price) / 1000).toString() : '—'}</div>
                  <div className="text-xs text-gray-500 mt-2">Last updated: {oraclePrice?.lastUpdated ? new Date(oraclePrice.lastUpdated).toLocaleString() : '—'}</div>

                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">History</div>
                    <ul className="space-y-2">
                      {oracleHistory.length === 0 ? (
                        <li className="text-sm text-gray-500">No history</li>
                      ) : (
                        oracleHistory.map((h: any) => (
                          <li key={h.id} className="flex justify-between text-xs text-gray-600">
                            <span>{(Number(h.price) / 1000).toString()}</span>
                            <span>{new Date(h.timestamp).toLocaleString()}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* My Transfers */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">My Transfers</h2>
            {!address ? (
              <div className="text-sm text-gray-500">Connect your wallet to see your transfers</div>
            ) : loadingMy ? (
              <div>Loading your transfers...</div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow flex flex-col">
                <h4 className="font-medium mb-3">My Transfers </h4>
                {myTransfers.length === 0 ? (
                  <div className="text-sm text-gray-500">No recent transfers</div>
                ) : (
                  <ul className="space-y-2">
                    {myTransfers.slice(0, 5).map(t => (
                      <li key={t.id} className="flex justify-between items-center border p-3 rounded">
                        <div className="min-w-0">
                          <div className="font-mono text-sm truncate">{t.txHash}</div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(t.timestamp).toLocaleString()}</div>
                          <div className="text-xs text-gray-500 mt-1">{t.tokenType === 'ERC20' ? `${t.amount} ${t.tokenSymbol}` : `Token ID: ${t.tokenId}`}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 text-right mt-auto">
                  <Link href="/transactions?view=my" className="text-sm text-blue-600 hover:underline">Show more →</Link>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
