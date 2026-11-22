'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronDown, X, Sparkles, Check } from 'lucide-react';

export interface CustomTimePickerProps {
  value?: string; // HH:mm or HH:mm:ss
  onChange: (time: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const POPULAR_PRESETS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '11:00',
  '13:00',
  '13:30',
  '14:00',
  '15:00',
  '16:00',
];

const WORKING_HOURS = ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
const OTHER_HOURS = ['00', '01', '02', '03', '04', '05', '06', '19', '20', '21', '22', '23'];
const MINUTES_5 = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function CustomTimePicker({
  value = '',
  onChange,
  label,
  placeholder = 'Pilih jam...',
  required = false,
  error,
  className = '',
  disabled = false,
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Normalize HH:mm
  const normalizedVal = value ? value.substring(0, 5) : '';
  const [typedInput, setTypedInput] = useState(normalizedVal);
  const [activeTab, setActiveTab] = useState<'working' | 'all'>('working');

  const [selectedHour, setSelectedHour] = useState<string>('08');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');

  useEffect(() => {
    setTypedInput(normalizedVal);
    if (normalizedVal && normalizedVal.includes(':')) {
      const [h, m] = normalizedVal.split(':');
      if (h) setSelectedHour(h);
      if (m) setSelectedMinute(m);
    }
  }, [normalizedVal]);

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
    const popHeight = popoverRef.current.offsetHeight || 420;

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
  }, [shouldRender, activeTab, updatePosition]);

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

  // Click outside to close
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

  const handleHourSelect = (h: string) => {
    setSelectedHour(h);
    const newTime = `${h}:${selectedMinute}`;
    onChange(newTime);
  };

  const handleMinuteSelect = (m: string) => {
    setSelectedMinute(m);
    const newTime = `${selectedHour}:${m}`;
    onChange(newTime);
  };

  const handlePresetSelect = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    setSelectedHour(h);
    setSelectedMinute(m);
    onChange(timeStr);
    setIsOpen(false);
  };

  // Direct keyboard input handling (e.g. typing "0830" or "14:00")
  const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits and colon
    const cleaned = raw.replace(/[^0-9:]/g, '');
    setTypedInput(cleaned);

    // Auto format if 4 digits e.g. "0830" -> "08:30"
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length === 4) {
      const h = parseInt(digitsOnly.slice(0, 2), 10);
      const m = parseInt(digitsOnly.slice(2, 4), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const formatted = `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2, 4)}`;
        onChange(formatted);
        setSelectedHour(digitsOnly.slice(0, 2));
        setSelectedMinute(digitsOnly.slice(2, 4));
        setTypedInput(formatted);
      }
    } else if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && h >= 0 && h <= 23 && !isNaN(m) && m >= 0 && m <= 59) {
        onChange(cleaned.substring(0, 5));
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setTypedInput('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Styled Input Container with Polinela Colors */}
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(true)}
        className={`w-full h-[38px] px-2.5 rounded-[8px] flex items-center justify-between transition-[border-color,box-shadow,background-color] duration-150 cursor-pointer ${
          error
            ? 'bg-[#F9E9E9] border border-[#B8484A] ring-1 ring-[#B8484A]/30'
            : isOpen
            ? 'bg-white border border-[#003D58] ring-2 ring-[#003D58]/15 shadow-sm'
            : 'bg-white border border-[#E2E8F0] hover:border-[#35C6D4] hover:shadow-2xs'
        } shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:bg-slate-100 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center text-[#003D58] shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            value={typedInput}
            onChange={handleDirectInputChange}
            onFocus={() => setIsOpen(true)}
            className="w-full min-w-[44px] bg-transparent text-[12px] font-bold text-slate-800 placeholder:text-[#67686D]/60 placeholder:font-normal focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {normalizedVal && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#003D58] border border-blue-200 uppercase tracking-wider">
              WIB
            </span>
          )}
          {normalizedVal && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Hapus jam"
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
      </div>

      {error && <p className="text-[11px] text-[#B8484A] font-medium mt-1">{error}</p>}

      {/* Popover Time Picker (Polinela Styled: Navy & Cyan) rendered via Portal */}
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
          {/* Header Time Card */}
          <div className="bg-gradient-to-r from-[#003D58] to-[#00557A] rounded-xl p-3 text-white flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#35C6D4] tracking-wider block">
                Format 24 Jam (WIB)
              </span>
              <div className="text-xl font-black tracking-wider flex items-center gap-1.5 mt-0.5">
                <span>{selectedHour}</span>
                <span className="text-[#35C6D4] animate-pulse">:</span>
                <span>{selectedMinute}</span>
                <span className="text-xs font-semibold text-sky-200 ml-1">WIB</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-[11px] font-bold bg-[#35C6D4] hover:bg-[#2EB0BE] text-[#003D58] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Pilih
            </button>
          </div>

          {/* Quick Popular Presets (1-Click Selection) */}
          <div className="py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-[#35C6D4]" />
              <span>Pilihan Jam Cepat:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {POPULAR_PRESETS.map((timeStr) => {
                const isSelected = normalizedVal === timeStr;
                return (
                  <button
                    key={timeStr}
                    type="button"
                    onClick={() => handlePresetSelect(timeStr)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#003D58] text-white shadow-2xs ring-1 ring-[#003D58]'
                        : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#003D58] border border-slate-200'
                    }`}
                  >
                    {timeStr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Selection for Hour & Minute */}
          <div className="pt-2.5 space-y-2.5">
            {/* Hours Header & Tabs */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Pilih Jam:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('working')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeTab === 'working' ? 'bg-white text-[#003D58] shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  07:00 - 18:00
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeTab === 'all' ? 'bg-white text-[#003D58] shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Lainnya
                </button>
              </div>
            </div>

            {/* Hours Grid */}
            <div className="grid grid-cols-6 gap-1.5">
              {(activeTab === 'working' ? WORKING_HOURS : OTHER_HOURS).map((h) => {
                const isMatch = selectedHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`h-7 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                      isMatch
                        ? 'bg-[#003D58] text-white shadow-xs font-black scale-105'
                        : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#003D58] border border-slate-200/80'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Minutes Grid */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Pilih Menit:
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {MINUTES_5.map((m) => {
                  const isMatch = selectedMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={`h-7 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isMatch
                          ? 'bg-[#35C6D4] text-[#003D58] shadow-xs font-black scale-105'
                          : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#003D58] border border-slate-200/80'
                      }`}
                    >
                      :{m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Footer Instruction */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Tip: Anda juga bisa ketik langsung (cth: 0830)</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#003D58] font-bold hover:underline cursor-pointer"
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
