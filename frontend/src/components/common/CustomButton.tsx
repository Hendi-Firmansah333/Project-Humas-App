import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'danger-outline' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export default function CustomButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}: CustomButtonProps) {
  const baseStyles =
    'font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0';

  const variantStyles = {
    primary: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs shadow-teal-600/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    outline: 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs shadow-red-600/20',
    'danger-outline': 'bg-white border border-red-200 hover:bg-red-50 text-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs shadow-amber-500/20',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 h-8',
    md: 'text-xs sm:text-sm px-4 py-2.5 h-10',
    lg: 'text-sm px-5 py-3 h-12',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
