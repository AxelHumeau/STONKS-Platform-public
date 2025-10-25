import React from 'react';
import Pagination from './Pagination';
import { TransferEvent } from '../lib/api';

type ViewType = 'all' | 'erc20' | 'erc721' | 'my' | string;

type Props = {
  items: TransferEvent[];
  perPage?: number;
  loading?: boolean;
  view?: ViewType;
};

export default function DetailedTransactionTable({ items, perPage = 15, loading = false, view = 'all' }: Props) {
  const [page, setPage] = React.useState(1);

  React.useEffect(() => setPage(1), [items]);

  const total = items.length;
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  const showTokenId = view !== 'erc20';
  const showAmount = view !== 'erc721';

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">Showing {Math.min(total, start + 1)} - {Math.min(total, start + pageItems.length)} of {total}</div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : total === 0 ? (
        <div className="text-sm text-gray-500">No transactions found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="px-2 py-1">id</th>
                <th className="px-2 py-1">txHash</th>
                <th className="px-2 py-1">from</th>
                <th className="px-2 py-1">to</th>
                <th className="px-2 py-1">tokenAddress</th>
                {showTokenId && <th className="px-2 py-1">tokenId</th>}
                {showAmount && <th className="px-2 py-1">amount</th>}
                <th className="px-2 py-1">tokenType</th>
                <th className="px-2 py-1">tokenSymbol</th>
                <th className="px-2 py-1">blockNumber</th>
                <th className="px-2 py-1">timestamp</th>
                <th className="px-2 py-1">createdAt</th>
                {/* raw removed */}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t: TransferEvent) => (
                <tr key={t.id} className="border-t align-top">
                  <td className="px-2 py-2">{t.id}</td>
                  <td className="px-2 py-2 font-mono truncate max-w-[220px]">{t.txHash}</td>
                  <td className="px-2 py-2">{t.from}</td>
                  <td className="px-2 py-2">{t.to}</td>
                  <td className="px-2 py-2">{t.tokenAddress}</td>
                  {showTokenId && <td className="px-2 py-2">{t.tokenId ?? '—'}</td>}
                  {showAmount && <td className="px-2 py-2">{t.amount ?? '—'}</td>}
                  <td className="px-2 py-2">{t.tokenType}</td>
                  <td className="px-2 py-2">{t.tokenSymbol}</td>
                  <td className="px-2 py-2">{t.blockNumber}</td>
                  <td className="px-2 py-2">{new Date(t.timestamp).toLocaleString()}</td>
                  <td className="px-2 py-2">{t.createdAt}</td>
                  {/* raw removed */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination total={total} perPage={perPage} current={page} onChange={p => setPage(p)} />
    </div>
  );
}
