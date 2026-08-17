import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-[#1E3A8A] text-white hover:bg-[#152e73] focus:ring-[#1E3A8A]',
    secondary: 'bg-[#FACC15] text-[#0f172a] hover:bg-[#eab308] focus:ring-[#FACC15]',
    outline: 'border-2 border-white text-white hover:bg-white/10 focus:ring-white',
    ghost: 'hover:bg-slate-100 text-slate-700',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-6 py-2 text-base',
    lg: 'h-14 px-8 py-3 text-lg',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </button>
  );
}
