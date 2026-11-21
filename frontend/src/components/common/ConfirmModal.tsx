'use client';

import React from 'react';
import CustomModal from './CustomModal';
import { AlertTriangle, AlertCircle, HelpCircle, CheckCircle2, LucideIcon, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: LucideIcon;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  icon: CustomIcon,
  isLoading = false,
}: ConfirmModalProps) {
  const getIcon = () => {
    if (CustomIcon) return CustomIcon;
    switch (variant) {
      case 'danger':
        return AlertTriangle;
      case 'warning':
        return AlertCircle;
      case 'primary':
        return HelpCircle;
      default:
        return CheckCircle2;
    }
  };

  const IconComponent = getIcon();

  const variantStyles = {
    danger: {
      iconRing: 'bg-red-50/70 p-2 rounded-full',
      iconBg: 'bg-red-50 text-red-600 border border-red-100',
      confirmClass:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs shadow-red-600/20',
    },
    warning: {
      iconRing: 'bg-amber-50/70 p-2 rounded-full',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      confirmClass:
        'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-xs shadow-amber-500/20',
    },
    primary: {
      iconRing: 'bg-[#C0FFEA]/50 p-2 rounded-full',
      iconBg: 'bg-[#C0FFEA]/70 text-[#003D58] border border-[#51FCE4]/60',
      confirmClass:
        'bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white shadow-xs shadow-[#003D58]/20',
    },
  };

  const style = variantStyles[variant] || variantStyles.primary;

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      maxWidth="max-w-[440px]"
      closeOnBackdrop={!isLoading}
      closeOnEsc={!isLoading}
    >
      <div className="pt-1 pb-0.5 text-center font-['Poppins']">
        {/* Centered Soft-Ring Icon */}
        <div className={`inline-flex items-center justify-center mx-auto ${style.iconRing}`}>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${style.iconBg}`}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <IconComponent className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>
        </div>

        {/* Title & Message */}
        <div className="mt-4 space-y-1.5 px-2">
          <h3 className="text-[17px] font-bold text-[#003D58] leading-snug tracking-tight">
            {title}
          </h3>
          {message && (
            <div className="text-[13px] text-slate-500 leading-relaxed">
              {message}
            </div>
          )}
        </div>

        {/* Balanced Single-Line Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 min-w-[120px] px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#003D58]/30 focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`h-10 min-w-[140px] px-5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#003D58]/30 focus:outline-none ${style.confirmClass}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
            <span>{isLoading ? 'Memproses...' : confirmText}</span>
          </button>
        </div>
      </div>
    </CustomModal>
  );
}

