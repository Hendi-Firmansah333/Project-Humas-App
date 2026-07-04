import React from 'react';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBox({
  value,
  onChange,
  placeholder = 'Cari...',
  className = '',
}: SearchBoxProps) {
  return (
    <div
      className={`relative flex items-center w-full sm:w-64 md:w-80 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-600 transition-all ${className}`}
    >
      <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  );
}
