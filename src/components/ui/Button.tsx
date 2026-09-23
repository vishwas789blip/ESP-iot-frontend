import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-cyan/90 hover:bg-accent-cyan text-ink-900 font-semibold shadow-glow hover:shadow-glow transition-all',
  secondary:
    'bg-ink-600 hover:bg-ink-500 text-white border border-white/5 transition-colors',
  ghost: 'hover:bg-white/5 text-gray-300 hover:text-white transition-colors',
  danger:
    'bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/30 transition-colors',
  outline:
    'border border-white/10 hover:border-accent-cyan/50 hover:bg-accent-cyan/5 text-gray-200 transition-colors',
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-lg gap-2',
  lg: 'text-base px-6 py-3 rounded-xl gap-2',
  icon: 'p-2.5 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-cyan/40 ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
