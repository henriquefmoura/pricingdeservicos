import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { PricingMentorWidget } from './components/pricing-mentor/PricingMentorWidget';
import { AppInitializer } from './components/AppInitializer';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Erro desconhecido' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RootErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#F8FAFC',
            gap: '16px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#001022', margin: 0 }}>
            Algo deu errado
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '400px', margin: 0 }}>
            Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#78BE20',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Recarregar página
          </button>
          {import.meta.env.DEV && (
            <pre
              style={{
                fontSize: '11px',
                color: '#DC2626',
                backgroundColor: '#FEF2F2',
                padding: '12px',
                borderRadius: '6px',
                maxWidth: '600px',
                overflow: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.errorMessage}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <RootErrorBoundary>
      <AppInitializer />
      <RouterProvider router={router} />
      <PricingMentorWidget />
      <Toaster />
      <Analytics />
    </RootErrorBoundary>
  );
}