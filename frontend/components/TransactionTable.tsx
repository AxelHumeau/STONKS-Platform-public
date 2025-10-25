import React from 'react';
import Pagination from './Pagination';

type Event = any;

type Props = {
  items: Event[];
  perPage?: number;
  loading?: boolean;
};

export default function TransactionTable({ items, perPage = 15, loading = false }: Props) {
  const [page, setPage] = React.useState(1);

  React.useEffect(() => setPage(1), [items]);

  const total = items.length;
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

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
                <th className="px-2 py-1">Hash</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">Amount / TokenId</th>
                <th className="px-2 py-1">From</th>
                <th className="px-2 py-1">To</th>
                <th className="px-2 py-1">When</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t: any) => (
                <tr key={t.id} className="border-t">
                  <td className="px-2 py-2 font-mono truncate max-w-[200px]">{t.txHash}</td>
                  <td className="px-2 py-2">{t.tokenType}</td>
                  <td className="px-2 py-2">{t.tokenType === 'ERC20' ? `${t.amount ?? '—'} ${t.tokenSymbol ?? ''}` : `#${t.tokenId ?? '—'}`}</td>
                  <td className="px-2 py-2">{t.from ?? '—'}</td>
                  <td className="px-2 py-2">{t.to ?? '—'}</td>
                  <td className="px-2 py-2">{t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}</td>
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
