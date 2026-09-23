import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-gray-400 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-ink-700/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/30 transition-all ${icon ? 'pl-10' : ''} ${error ? 'border-accent-red/50' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-accent-red">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
