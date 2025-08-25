'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SEOContextType {
  updatePageTitle: (title: string) => void
  preloadRoute: (route: string) => void
  trackPageView: (page: string, metadata?: Record<string, any>) => void
}

const SEOContext = createContext<SEOContextType | undefined>(undefined)

export function SEOProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const updatePageTitle = (title: string) => {
    if (typeof document !== 'undefined') {
      document.title = `${title} | Sistema de Gestión de Comedor`
    }
  }

  const preloadRoute = (route: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = route
      document.head.appendChild(link)
    }
  }

  const trackPageView = (page: string, metadata?: Record<string, any>) => {
    // Integración con analytics (Google Analytics, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_TRACKING_ID', {
        page_title: page,
        page_location: window.location.href,
        ...metadata
      })
    }

    // También enviar a service worker para cache inteligente
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PAGE_VIEW',
        data: { page, pathname, timestamp: new Date().toISOString(), ...metadata }
      })
    }
  }

  // Track page views automáticamente
  useEffect(() => {
    const pageMap: Record<string, string> = {
      '/admin': 'Admin Principal',
      '/admin/dashboard': 'Dashboard',
      '/admin/dashboard/live': 'Dashboard en Tiempo Real',
      '/admin/empleados': 'Gestión de Empleados',
      '/login': 'Iniciar Sesión',
      '/setup': 'Configuración Inicial'
    }

    const pageName = pageMap[pathname] || pathname
    trackPageView(pageName)
  }, [pathname])

  // Preload rutas críticas
  useEffect(() => {
    const criticalRoutes = [
      '/admin/dashboard',
      '/admin/empleados',
      '/admin/dashboard/live'
    ]

    // Preload después de 2 segundos para no interferir con la carga inicial
    const timer = setTimeout(() => {
      criticalRoutes.forEach(route => preloadRoute(route))
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const value: SEOContextType = {
    updatePageTitle,
    preloadRoute,
    trackPageView
  }

  return (
    <SEOContext.Provider value={value}>
      {children}
    </SEOContext.Provider>
  )
}

export function useSEO() {
  const context = useContext(SEOContext)
  if (context === undefined) {
    throw new Error('useSEO must be used within a SEOProvider')
  }
  return context
}

export default SEOProvider