import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemName = 'data',
}: PaginationBarProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const end = Math.min(currentPage * 10, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-600">
      <div>
        Menampilkan <span className="font-semibold text-slate-800">{start}</span> hingga{' '}
        <span className="font-semibold text-slate-800">{end}</span> dari{' '}
        <span className="font-semibold text-slate-800">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          title="Halaman sebelumnya"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            aria-label={`Halaman ${page}`}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg font-semibold transition-all cursor-pointer ${
              currentPage === page
                ? 'bg-[#003D58] text-white shadow-xs shadow-[#003D58]/25'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          aria-label="Halaman berikutnya"
          title="Halaman berikutnya"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
