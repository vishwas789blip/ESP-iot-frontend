import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast, type ToastVariant } from '@/context/ToastContext';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors: Record<ToastVariant, string> = {
  success: 'border-accent-green/30 text-accent-green',
  error: 'border-accent-red/30 text-accent-red',
  info: 'border-accent-blue/30 text-accent-blue',
  warning: 'border-accent-amber/30 text-accent-amber',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant];
        return (
          <div
            key={toast.id}
            className={`glass-card px-4 py-3 flex items-start gap-3 border-l-2 ${colors[toast.variant]} animate-slide-in-right shadow-xl`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${colors[toast.variant].split(' ').pop()}`} />
            <p className="text-sm text-gray-200 flex-1">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
