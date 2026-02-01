'use client';

import * as React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
  errorMessage: string | null;
}

export default class SentryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: null,
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = Sentry.captureException(error);
    return {
      hasError: true,
      errorId,
      errorMessage: error.message || 'An unknown error occurred',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SentryErrorBoundary caught an error:', error, errorInfo);
    Sentry.captureException(error, { extra: { ...errorInfo } });
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-lg border border-slate-800 p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-400 mb-4">
              {this.state.errorMessage || 'An unexpected error occurred'}
            </p>
            {this.state.errorId && (
              <p className="text-xs text-slate-500 mb-4 font-mono">
                Error ID: {this.state.errorId}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
