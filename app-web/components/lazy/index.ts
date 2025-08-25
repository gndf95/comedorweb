// Lazy loading de componentes pesados para mejor rendimiento
import { lazy } from 'react'

// Dashboard componentes
export const LazyLiveDashboard = lazy(() => 
  import('@/components/ui/live-dashboard').then(module => ({
    default: module.LiveDashboard
  }))
)

export const LazyAdvancedStatistics = lazy(() => 
  import('@/components/ui/advanced-statistics').then(module => ({
    default: module.AdvancedStatistics
  }))
)

export const LazyBulkBarcodePrint = lazy(() => 
  import('@/components/ui/bulk-barcode-print').then(module => ({
    default: module.BulkBarcodePrint
  }))
)

// Modal componentes
export const LazyBarcodeModal = lazy(() => 
  import('@/components/ui/barcode-modal').then(module => ({
    default: module.BarcodeModal
  }))
)

// Páginas principales
export const LazyDashboardPage = lazy(() => 
  import('@/app/admin/dashboard/page')
)

export const LazyEmpleadosPage = lazy(() => 
  import('@/app/admin/empleados/page')
)

export const LazyLiveDashboardPage = lazy(() => 
  import('@/app/admin/dashboard/live/page')
)

// Componente de loading universal
export const ComponentLoader = ({ 
  message = 'Cargando...',
  size = 'medium' 
}: { 
  message?: string
  size?: 'small' | 'medium' | 'large' 
}) => {
  const sizeClasses = {
    small: 'h-20',
    medium: 'h-32',
    large: 'h-48'
  }

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  )
}

// HOC para lazy loading con suspense
import { Suspense, ComponentType } from 'react'

export function withLazyLoading<P extends object>(
  LazyComponent: ComponentType<P>,
  fallback?: React.ReactNode,
  errorBoundary?: ComponentType<{ children: React.ReactNode }>
) {
  const WrappedComponent = (props: P) => {
    const content = (
      <Suspense fallback={fallback || <ComponentLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    )

    if (errorBoundary) {
      const ErrorBoundary = errorBoundary
      return (
        <ErrorBoundary>
          {content}
        </ErrorBoundary>
      )
    }

    return content
  }

  WrappedComponent.displayName = `withLazyLoading(${LazyComponent.displayName || LazyComponent.name})`
  
  return WrappedComponent
}

// Error boundary para lazy components
import { Component, ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export class LazyErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-32 border border-red-200 bg-red-50 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 mb-2">⚠️</div>
            <p className="text-red-800 text-sm font-medium">Error al cargar el componente</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-xs text-red-600 underline hover:text-red-800"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Preloader para componentes críticos
export const preloadComponents = {
  dashboard: () => import('@/components/ui/live-dashboard'),
  statistics: () => import('@/components/ui/advanced-statistics'),
  barcodePrint: () => import('@/components/ui/bulk-barcode-print'),
  barcodeModal: () => import('@/components/ui/barcode-modal')
}

// Hook para precargar componentes
import { useEffect } from 'react'

export function usePreloadComponents(components: (keyof typeof preloadComponents)[]) {
  useEffect(() => {
    const timeouts = components.map((component, index) => {
      return setTimeout(() => {
        preloadComponents[component]()
      }, index * 100) // Escalonar las cargas
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [components])
}

// Lazy loading con intersección observer
import { useState, useRef } from 'react'

export function useLazyIntersection(
  threshold = 0.1,
  rootMargin = '50px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || hasLoaded) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true)
          setHasLoaded(true)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, hasLoaded])

  return { elementRef, isIntersecting, hasLoaded }
}

export default {
  LazyLiveDashboard,
  LazyAdvancedStatistics,
  LazyBulkBarcodePrint,
  LazyBarcodeModal,
  ComponentLoader,
  withLazyLoading,
  LazyErrorBoundary,
  preloadComponents,
  usePreloadComponents,
  useLazyIntersection
}