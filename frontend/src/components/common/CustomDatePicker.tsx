'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export interface CustomDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agt',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function padZero(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return dateStr;

  return `${DAY_FULL[d.getDay()]}, ${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

export default function CustomDatePicker({
  value = '',
  onChange,
  label,
  placeholder = 'Pilih tanggal...',
  required = false,
  error,
  minDate,
  maxDate,
  className = '',
  disabled = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }
    setIsVisible(false);
    const timer = window.setTimeout(() => {
      setShouldRender(false);
    }, 160);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const todayStr = `${currentYear}-${padZero(currentMonth + 1)}-${padZero(today.getDate())}`;

  const [viewYear, setViewYear] = useState<number>(() => {
    if (value && value.includes('-')) {
      const y = parseInt(value.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return currentYear;
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (value && value.includes('-')) {
      const m = parseInt(value.split('-')[1], 10) - 1;
      if (!isNaN(m) && m >= 0 && m <= 11) return m;
    }
    return currentMonth;
  });

  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const gap = 6;

    if (rect.bottom < 0 || rect.top > vh) {
      setIsOpen(false);
      return;
    }

    const popWidth = popoverRef.current.offsetWidth || Math.min(320, vw - margin * 2);
    const popHeight = popoverRef.current.offsetHeight || 390;

    let top: number;
    let nextPlacement: 'bottom' | 'top';
    if (vh - rect.bottom - margin >= popHeight + gap) {
      top = rect.bottom + gap;
      nextPlacement = 'bottom';
    } else if (rect.top - margin >= popHeight + gap) {
      top = rect.top - popHeight - gap;
      nextPlacement = 'top';
    } else {
      const openBelow = vh - rect.bottom >= rect.top;
      nextPlacement = openBelow ? 'bottom' : 'top';
      top = openBelow ? rect.bottom + gap : rect.top - popHeight - gap;
      top = Math.max(margin, Math.min(top, vh - popHeight - margin));
    }

    let left = rect.left;
    let horizontalOrigin: 'left' | 'right' = 'left';
    if (left + popWidth > vw - margin) {
      left = rect.right - popWidth;
      horizontalOrigin = 'right';
    }
    left = Math.max(margin, Math.min(left, vw - popWidth - margin));

    popoverRef.current.style.top = `${top}px`;
    popoverRef.current.style.left = `${left}px`;
    popoverRef.current.style.transformOrigin = `${nextPlacement === 'top' ? 'bottom' : 'top'} ${horizontalOrigin}`;
    setPlacement((prev) => (prev === nextPlacement ? prev : nextPlacement));
  }, []);

  useLayoutEffect(() => {
    if (!shouldRender) return;
    updatePosition();
    const handleScroll = (e: Event) => {
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) return;
      updatePosition();
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [shouldRender, viewMonth, viewYear, updatePosition]);

  useEffect(() => {
    if (!shouldRender || !isOpen) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [shouldRender, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inPopover = popoverRef.current?.contains(target);
      if (!inContainer && !inPopover) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectQuick = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const formatted = `${target.getFullYear()}-${padZero(target.getMonth() + 1)}-${padZero(
      target.getDate()
    )}`;
    onChange(formatted);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Styled Input Container with Polinela Colors */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-[38px] px-2.5 rounded-[8px] flex items-center justify-between text-left transition-[border-color,box-shadow,background-color] duration-150 cursor-pointer ${
          error
            ? 'bg-[#F9E9E9] border border-[#B8484A] text-[#B8484A] focus:ring-1 focus:ring-[#B8484A]/40'
            : isOpen
            ? 'bg-white border border-[#003D58] ring-2 ring-[#003D58]/15 shadow-sm text-[#202938]'
            : 'bg-white border border-[#E2E8F0] hover:border-[#35C6D4] hover:shadow-2xs text-[#202938]'
        } shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:bg-slate-100 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center text-[#003D58] shrink-0">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <span
            className={`text-[12px] truncate ${
              value ? 'font-bold text-slate-800' : 'text-[#67686D]/60 font-normal'
            }`}
          >
            {value ? formatDateIndo(value) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Hapus tanggal"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#003D58]' : ''
            }`}
          />
        </div>
      </button>

      {error && <p className="text-[11px] text-[#B8484A] font-medium mt-1">{error}</p>}

      {/* Popover Calendar (Polinela Styled: Navy & Cyan) rendered via Portal */}
      {mounted && shouldRender && createPortal(
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            opacity: isVisible ? 1 : 0,
            transform: isVisible
              ? 'translate3d(0, 0, 0) scale(1)'
              : placement === 'top'
              ? 'translate3d(0, 6px, 0) scale(0.97)'
              : 'translate3d(0, -6px, 0) scale(0.97)',
            transition: isVisible
              ? 'opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
              : 'opacity 140ms cubic-bezier(0.4, 0, 1, 1), transform 140ms cubic-bezier(0.4, 0, 1, 1)',
            willChange: 'transform, opacity',
            pointerEvents: isVisible ? 'auto' : 'none',
          }}
          className="z-[10050] bg-white border border-slate-200 rounded-2xl shadow-2xl p-3.5 sm:p-4 w-[min(320px,calc(100vw-24px))] max-h-[calc(100vh-24px)] overflow-y-auto"
        >
          {/* Header Card with Gradient */}
          <div className="bg-gradient-to-r from-[#003D58] to-[#00557A] rounded-xl p-3 text-white flex items-center justify-between shadow-sm mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-[#35C6D4] tracking-wider block">
                Kalender Kegiatan
              </span>
              <div className="text-sm font-black text-white tracking-wide">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mr-0.5">
              <Sparkles className="w-3 h-3 text-[#35C6D4]" />
              <span>Cepat:</span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectQuick(0)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#003D58] transition-colors cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuick(1)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Besok
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuick(7)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              +7 Hari
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center my-2">
            {DAY_NAMES.map((d, idx) => (
              <span
                key={d}
                className={`text-[10px] font-black uppercase py-1 ${
                  idx === 0 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <span key={`empty-${i}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
              const isSelected = value === dateKey;
              const isToday = dateKey === todayStr;

              let isDisabled = false;
              if (minDate && dateKey < minDate) isDisabled = true;
              if (maxDate && dateKey > maxDate) isDisabled = true;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#003D58] text-white shadow-xs font-black ring-2 ring-[#35C6D4] scale-105'
                      : isToday
                      ? 'border-2 border-[#35C6D4] text-[#003D58] font-black bg-sky-50/50'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#003D58]'
                  } disabled:opacity-20 disabled:cursor-not-allowed`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Selected Info */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate">
              Pilihan:{' '}
              <strong className="text-[#003D58]">
                {value ? formatDateIndo(value) : 'Belum dipilih'}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-[#003D58] hover:underline cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
