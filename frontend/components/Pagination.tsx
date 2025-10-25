import React from 'react';

type Props = {
  total: number;
  perPage: number;
  current: number;
  onChange: (page: number) => void;
};

export default function Pagination({ total, perPage, current, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pages = [] as number[];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  if (totalPages === 1) return null;

  return (
    <div className="flex items-center space-x-2 mt-4">
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="px-2 py-1 rounded border bg-white disabled:opacity-50"
      >
        Prev
      </button>

      <div className="flex space-x-1">
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-2 py-1 rounded border ${p === current ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={() => onChange(Math.min(totalPages, current + 1))}
        disabled={current === totalPages}
        className="px-2 py-1 rounded border bg-white disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
