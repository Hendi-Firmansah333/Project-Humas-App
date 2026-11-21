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
        <label htmlFor={inputId} className="block text-[12px] font-[600] leading-[16px] text-[#202938] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-[#67686D] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full h-[36px] rounded-[8px] px-3.5 text-[12px] text-[#202938] placeholder:text-[#67686D]/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all disabled:bg-[#DBDCE0]/30 disabled:border-[#DBDCE0] disabled:text-[#67686D] disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : ''
          } ${
            error
              ? 'bg-[#F9E9E9] border border-[#B8484A] text-[#B8484A] focus:ring-1 focus:ring-[#B8484A]/40'
              : 'bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-[#B8484A] font-medium mt-1">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-[#67686D] mt-1">{helperText}</p>}
    </div>
  );
}
