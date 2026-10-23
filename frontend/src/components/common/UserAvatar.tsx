import React from 'react';
import { getInitials, isValidImageSrc } from '@/utils/formatters';

interface UserAvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function UserAvatar({
  src,
  name = 'Admin Humas',
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-[#bbf7d0] text-[#166534] font-bold flex items-center justify-center border border-emerald-200 shadow-2xs shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {isValidImageSrc(src) ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
