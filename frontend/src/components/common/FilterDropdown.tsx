'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Filter, Check, X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: boolean;
  align?: 'left' | 'right';
}

export default function FilterDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = 'Semua Filter',
  className = '',
  icon = true,
  align = 'left',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isFiltered = Boolean(value);
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    },
    [isOpen]
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block text-left select-none ${className}`}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder || 'Pilihan filter'}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full inline-flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none ${
          isFiltered
            ? 'bg-blue-50/50 border border-[#003D58] text-[#003D58] ring-2 ring-[#003D58]/15 shadow-xs'
            : isOpen
              ? 'bg-white border border-[#35C6D4] text-slate-800 ring-2 ring-[#35C6D4]/20 shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-[#35C6D4] hover:shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <Filter
              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                isFiltered ? 'text-[#003D58]' : 'text-slate-400'
              }`}
            />
          )}
          <span className="truncate leading-tight">{displayLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {/* Quick Clear Button when filter is active */}
          {isFiltered && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e as any);
                }
              }}
              aria-label="Hapus filter"
              title="Reset filter"
              className="p-0.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen
                ? 'rotate-180 text-[#003D58]'
                : isFiltered
                  ? 'text-[#003D58]'
                  : 'text-slate-400'
            }`}
          />
        </div>
      </button>

      {/* Custom Styled Floating Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={placeholder}
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1.5 min-w-[210px] w-full max-h-72 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 focus:outline-none`}
        >
          {/* All / Default Option (Reset to placeholder) */}
          {placeholder && (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => handleSelect('')}
              className={`w-[calc(100%-12px)] mx-1.5 my-0.5 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-medium flex items-center justify-between gap-2 cursor-pointer transition-colors text-left ${
                !value
                  ? 'bg-[#003D58] text-white font-semibold shadow-xs'
                  : 'text-slate-700 hover:bg-blue-50/70 hover:text-[#003D58]'
              }`}
            >
              <span className="truncate">{placeholder}</span>
              {!value && <Check className="w-4 h-4 text-[#35C6D4] shrink-0" />}
            </button>
          )}

          {/* Divider if placeholder exists */}
          {placeholder && options.length > 0 && (
            <div className="h-px bg-slate-100 my-1 mx-2" />
          )}

          {/* Dynamic Filter Options */}
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-[calc(100%-12px)] mx-1.5 my-0.5 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-medium flex items-center justify-between gap-2 cursor-pointer transition-colors text-left ${
                  isSelected
                    ? 'bg-[#003D58] text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-blue-50/70 hover:text-[#003D58]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-[#35C6D4] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
