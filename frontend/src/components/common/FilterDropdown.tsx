'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  disabled?: boolean;
  allowClear?: boolean;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

export default function FilterDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = 'Semua Filter',
  className = '',
  icon = true,
  align = 'left',
  disabled = false,
  allowClear = true,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFiltered = Boolean(value);
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 12;
    const gap = 6;

    const desiredWidth = Math.min(Math.max(rect.width, 210), viewportW - margin * 2);

    let left = align === 'right' ? rect.right - desiredWidth : rect.left;
    if (left + desiredWidth > viewportW - margin) {
      left = rect.right - desiredWidth;
    }
    if (left < margin) {
      left = margin;
    }
    if (left + desiredWidth > viewportW - margin) {
      left = Math.max(margin, viewportW - margin - desiredWidth);
    }

    const spaceBelow = viewportH - rect.bottom - margin - gap;
    const spaceAbove = rect.top - margin - gap;
    const preferredMax = 360;

    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
      setMenuPos({
        bottom: viewportH - rect.top + gap,
        left,
        width: desiredWidth,
        maxHeight: Math.max(140, Math.min(preferredMax, spaceAbove)),
      });
    } else {
      setMenuPos({
        top: rect.bottom + gap,
        left,
        width: desiredWidth,
        maxHeight: Math.max(140, Math.min(preferredMax, spaceBelow)),
      });
    }
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = (event: Event) => {
      if (menuRef.current && event.target instanceof Node && menuRef.current.contains(event.target)) {
        return;
      }
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Handle click outside (checking both trigger container and portaled menu)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
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
      } else if (e.key === 'ArrowDown' && !isOpen && !disabled) {
        e.preventDefault();
        setIsOpen(true);
      }
    },
    [isOpen, disabled]
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

  const menuElement =
    isOpen && !disabled && mounted && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={placeholder}
            style={{
              position: 'fixed',
              top: menuPos.top,
              bottom: menuPos.bottom,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: menuPos.maxHeight,
            }}
            className="overflow-y-auto [scrollbar-width:thin] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 space-y-0.5 z-[10050] animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
          >
            {/* All / Default Option (Reset to placeholder) */}
            {placeholder && allowClear && (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-[13px] font-medium flex items-center justify-between gap-2 cursor-pointer transition-colors text-left ${
                  !value
                    ? 'bg-[#003D58] text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-blue-50/70 hover:text-[#003D58]'
                }`}
              >
                <span className="truncate">{placeholder}</span>
                {!value && <Check className="w-4 h-4 text-[#35C6D4] shrink-0" />}
              </button>
            )}

            {/* Divider only when default reset option is actually shown */}
            {placeholder && allowClear && options.length > 0 && (
              <div className="h-px bg-slate-100 my-1 mx-1.5" />
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
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-[13px] font-medium flex items-center justify-between gap-2 cursor-pointer transition-colors text-left ${
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
          </div>,
          document.body
        )
      : null;

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
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder || 'Pilihan filter'}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full inline-flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003D58]/30 focus-visible:border-[#003D58] ${
          disabled
            ? 'bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed'
            : isFiltered
              ? 'bg-blue-50/50 border border-[#003D58] text-[#003D58] ring-2 ring-[#003D58]/15 shadow-xs cursor-pointer'
              : isOpen
                ? 'bg-white border border-[#35C6D4] text-slate-800 ring-2 ring-[#35C6D4]/20 shadow-xs cursor-pointer'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-[#35C6D4] hover:shadow-xs cursor-pointer'
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
          {isFiltered && allowClear && !disabled && (
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

      {menuElement}
    </div>
  );
}
