import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
            <AlertTriangle size={28} />
          </div>
          <div className="max-w-md">
            <h2 className="text-base font-semibold text-ink">Something went wrong</h2>
            <p className="text-sm text-ink-subtle mt-1.5">
              An unexpected error occurred while rendering this view.
            </p>
            {this.state.error?.message && (
              <pre className="mt-3 p-3 bg-surface-100 rounded-xl text-xs font-mono text-red-600 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-card"
          >
            <RefreshCw size={15} />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
