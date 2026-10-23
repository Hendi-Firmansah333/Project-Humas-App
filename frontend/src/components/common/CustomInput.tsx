import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

export default function CustomInput({
  label,
  error,
  icon: Icon,
  helperText,
  className = '',
  id,
  ...props
}: CustomInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-[36px] rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all ${
            Icon ? 'pl-9' : ''
          } ${
            error
              ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
              : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-[#EF4444] font-medium mt-1">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
}
