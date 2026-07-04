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
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-600'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium mt-1">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
}
