'use client';

import React from 'react';
import CustomModal from './CustomModal';
import CustomButton from './CustomButton';
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
      iconBg: 'bg-red-50 text-red-600 border border-red-100',
      btnVariant: 'danger' as const,
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      btnVariant: 'warning' as const,
    },
    primary: {
      iconBg: 'bg-sky-50 text-[#003D58] border border-sky-100',
      btnVariant: 'primary' as const,
    },
  };

  const style = variantStyles[variant] || variantStyles.primary;

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      maxWidth="md"
      closeOnBackdrop={!isLoading}
      closeOnEsc={!isLoading}
    >
      <div className="py-1 text-center space-y-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs ${style.iconBg}`}
        >
          {isLoading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <IconComponent className="w-7 h-7" />
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {title}
          </h3>
          {message && (
            <div className="text-xs sm:text-sm text-slate-500 leading-relaxed px-1">
              {message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <CustomButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </CustomButton>
          <CustomButton
            type="button"
            variant={style.btnVariant}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </CustomButton>
        </div>
      </div>
    </CustomModal>
  );
}

