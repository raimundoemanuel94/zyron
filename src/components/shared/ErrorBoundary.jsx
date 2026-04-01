import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error, errorInfo) {
    return {
      hasError: true,
      error,
      errorInfo
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log do erro
    console.error('❌ ErrorBoundary capturou erro:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">❌ Erro Crítico</h1>
            <p className="mb-4">Ocorreu um erro inesperado</p>
            <div className="bg-red-800 p-4 rounded text-sm">
              <p className="font-medium mb-2">{this.state.error?.message || 'Erro desconhecido'}</p>
              <details className="text-left">
                <summary className="cursor-pointer font-medium">Detalhes Técnicos</summary>
                <pre className="text-xs mt-2 overflow-auto">
                  {JSON.stringify({
                    error: this.state.error?.message,
                    stack: this.state.error?.stack,
                    componentStack: this.state.errorInfo?.componentStack
                  }, null, 2)}
                </pre>
              </details>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
