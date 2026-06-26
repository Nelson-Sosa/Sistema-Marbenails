import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'

/**
 * ErrorBoundary catches React render errors in the component tree below it
 * and displays a friendly fallback UI instead of a blank white screen.
 *
 * Usage:
 * - Wrap page-level components or large feature sections
 * - The user can retry by clicking "Reintentar" (resets the error state)
 *
 * @example
 * <ErrorBoundary>
 *   <SomeFeatureComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // TODO: Send to error reporting service (Sentry, etc.)
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Algo salió mal
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Ocurrió un error inesperado. Por favor, intentá de nuevo.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-3 max-w-md overflow-auto rounded bg-slate-900 p-3 text-left text-xs text-red-300">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={this.handleReset}
          >
            Reintentar
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
