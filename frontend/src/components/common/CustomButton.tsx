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
    'font-bold rounded-full transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:bg-[#DBDCE0] disabled:text-white disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-100 shrink-0';

  const variantStyles = {
    primary: 'bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white shadow-xs shadow-[#003D58]/25',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-[#202938]',
    outline: 'bg-white border-2 border-[#003D58] hover:bg-[#003D58]/10 text-[#003D58] shadow-2xs',
    danger: 'bg-[#B8484A] hover:bg-[#A33D3F] active:bg-[#8E3234] text-white shadow-xs shadow-[#B8484A]/25',
    'danger-outline': 'bg-white border border-[#B8484A] hover:bg-[#F9E9E9] text-[#B8484A]',
    warning: 'bg-[#E99710] hover:bg-[#D4860B] active:bg-[#BF7608] text-white shadow-xs shadow-[#E99710]/25',
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
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
