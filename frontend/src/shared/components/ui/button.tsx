import React from 'react';
import { cn } from '@/shared/utils/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const buttonVariants = (opts?: {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}) => {
  const variant = opts?.variant || 'default';
  const size = opts?.size || 'default';

  const baseClasses =
    'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-[0.98]';

  const variantClasses = {
    default: 'bg-gradient-to-br from-primary to-[#6366F1] text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:opacity-95',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-secondary/50 hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-secondary/50 hover:text-accent-foreground',
    link: 'underline-offset-4 hover:underline text-primary',
  };

  const sizeClasses = {
    default: 'h-10 py-2 px-5',
    sm: 'h-9 px-3 rounded-lg text-xs',
    lg: 'h-11 px-8 rounded-2xl text-base',
    icon: 'h-10 w-10',
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'default', size = 'default', className = '', ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
