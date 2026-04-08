import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full group">
        {label && (
          <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-xl px-4 py-2.5 text-sm',
              'bg-white border border-[hsl(var(--border))]',
              'text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.7)]',
              'shadow-sm transition-all duration-200',
              'focus:outline-none focus:border-[hsl(var(--primary)/0.6)]',
              'focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)] focus:ring-offset-0',
              'hover:border-[hsl(var(--primary)/0.35)]',
              'disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-[hsl(var(--muted))]',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-gradient-to-r from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
        </div>
        {hint && !error && (
          <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
