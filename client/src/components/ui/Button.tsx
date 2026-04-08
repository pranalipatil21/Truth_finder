import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glow';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center whitespace-nowrap font-semibold',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
      'disabled:pointer-events-none disabled:opacity-40',
      'active:scale-[0.97]',
    ].join(' ');

    const variants = {
      default: [
        'bg-gradient-to-r from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)]',
        'text-white shadow-[0_4px_16px_hsl(252,83%,60%/0.35)]',
        'hover:shadow-[0_6px_24px_hsl(252,83%,60%/0.45)] hover:brightness-105',
      ].join(' '),

      destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',

      outline: [
        'border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))]',
        'hover:bg-[hsl(var(--secondary))] hover:border-[hsl(var(--primary)/0.4)]',
        'shadow-sm',
      ].join(' '),

      secondary: [
        'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]',
        'hover:bg-[hsl(220,20%,88%)]',
        'border border-[hsl(var(--border))]',
      ].join(' '),

      ghost: [
        'bg-transparent text-[hsl(var(--muted-foreground))]',
        'hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]',
      ].join(' '),

      link: 'bg-transparent text-[hsl(var(--primary))] underline-offset-4 hover:underline',

      glow: [
        'bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.3)]',
        'text-[hsl(var(--primary))]',
        'hover:bg-[hsl(var(--primary)/0.14)] hover:border-[hsl(var(--primary)/0.5)]',
        'hover:shadow-[0_0_16px_hsl(var(--primary)/0.2)]',
      ].join(' '),
    };

    const sizes = {
      default: 'h-10 px-5 py-2 text-sm rounded-xl',
      sm:      'h-8  px-4 py-1 text-xs rounded-lg',
      lg:      'h-12 px-8 py-3 text-base rounded-xl',
      xl:      'h-14 px-10 py-4 text-lg rounded-2xl',
      icon:    'h-10 w-10 rounded-xl',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
