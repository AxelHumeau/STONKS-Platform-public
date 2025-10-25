import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { apiService, TransferEvent } from '../lib/api';
import DetailedTransactionTable from '../components/DetailedTransactionTable';

const HeaderClient = dynamic(() => import('../components/HeaderClient'), { ssr: false });

export default function TransactionsPage() {
  const router = useRouter();
  const view = String(router.query?.view || 'all');
  const pageParam = Number(router.query?.page || 1);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const { address } = useAccount();

  const [items, setItems] = React.useState<TransferEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalScanned, setTotalScanned] = React.useState(0);

  React.useEffect(() => {
  let mounted = true;
  let timer: any = null;
  const load = async () => {
      try {
        setLoading(true);
        const raw = 500;
        const res = await apiService.getRecentEvents(raw, 'transfer');
        if (!mounted) return;
        const allEvents = res.events || [];
        const events: TransferEvent[] = (allEvents as any[]).filter(ev => ev && ev.type === 'transfer') as TransferEvent[];
        setTotalScanned(events.length);
        let filtered = events;
        if (view === 'erc20') filtered = events.filter(e => e.tokenType === 'ERC20');
        else if (view === 'erc721') filtered = events.filter(e => e.tokenType === 'ERC721');
        else if (view === 'my' && address) {
          const lower = address.toLowerCase();
          filtered = events.filter(e => (e.from && e.from.toLowerCase() === lower) || (e.to && e.to.toLowerCase() === lower));
        }
        setItems(filtered);
      } catch (err) {
        console.error('Failed to load transactions', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

  // initial load and polling
  load();
  timer = window.setInterval(load, 10000);
  return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [view, address, page]);

  return (
    <>
      <Head>
        <title>Transactions</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
              <HeaderClient address={address} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/marketplace')} className="text-sm text-blue-600 hover:underline">← Back</button>
              <div className="space-x-3">
                <button onClick={() => router.push('/transactions?view=all')} className={`px-3 py-1 rounded border ${view === 'all' ? 'bg-blue-600 text-white' : 'bg-white'}`}>All</button>
                <button onClick={() => router.push('/transactions?view=erc20')} className={`px-3 py-1 rounded border ${view === 'erc20' ? 'bg-blue-600 text-white' : 'bg-white'}`}>ERC20</button>
                <button onClick={() => router.push('/transactions?view=erc721')} className={`px-3 py-1 rounded border ${view === 'erc721' ? 'bg-blue-600 text-white' : 'bg-white'}`}>ERC721</button>
                <button onClick={() => router.push('/transactions?view=my')} className={`px-3 py-1 rounded border ${view === 'my' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Mine</button>
              </div>
            </div>
            <div className="text-sm text-gray-500">Scanned events: {totalScanned}</div>
          </div>

          <DetailedTransactionTable items={items} perPage={15} loading={loading} view={view} />
        </main>
      </div>
    </>
  );
}
