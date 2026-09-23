import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorId: null };

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
      errorId: crypto.randomUUID?.() ?? String(Date.now()),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep production logs useful without exposing stack traces in the UI.
    console.error('[UI] Unhandled application error', {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-ink-900 text-white flex items-center justify-center p-6">
        <section className="glass-card max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-accent-red" />
          </div>
          <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-400 mb-6">
            The application hit an unexpected error. Reload the page and try again.
          </p>
          {this.state.errorId && (
            <p className="text-[11px] text-gray-600 mb-4">Error ID: {this.state.errorId}</p>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan text-ink-900 font-medium hover:bg-accent-cyan/90"
          >
            <RefreshCw className="w-4 h-4" />
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
