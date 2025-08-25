'use client'

import { performanceMonitor } from './performance-monitoring'
import { errorTracker } from './error-tracking'
import { memoryCache } from './cache'

export class AppInitializer {
  private static initialized = false

  static async initialize() {
    if (this.initialized) return
    
    try {
      console.log('🚀 Iniciando optimizaciones del sistema...')

      // 1. Inicializar error tracking
      errorTracker.logInfo('Sistema inicializado', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })

      // 2. Inicializar performance monitoring
      performanceMonitor.trackCustomMetric('app_initialization_start', performance.now(), {
        component: 'AppInitializer'
      })

      // 3. Configurar cache inicial
      await this.setupInitialCache()

      // 4. Registrar service worker si no está registrado
      await this.ensureServiceWorkerRegistered()

      // 5. Preload recursos críticos
      await this.preloadCriticalResources()

      // 6. Configurar listeners de rendimiento
      this.setupPerformanceListeners()

      // 7. Configurar limpieza automática
      this.setupAutomaticCleanup()

      performanceMonitor.trackCustomMetric('app_initialization_complete', performance.now(), {
        component: 'AppInitializer'
      })

      this.initialized = true
      console.log('✅ Sistema completamente optimizado')
      
    } catch (error) {
      errorTracker.logError({
        message: 'Error durante la inicialización del sistema',
        stack: error instanceof Error ? error.stack : undefined,
        context: { error: error instanceof Error ? error.message : String(error) }
      })
      console.error('❌ Error en inicialización:', error)
    }
  }

  private static async setupInitialCache() {
    // Cachear datos críticos del dashboard
    const criticalEndpoints = [
      '/api/empleados/estadisticas',
      '/api/dashboard/metricas',
      '/api/turnos/actual'
    ]

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          memoryCache.set(endpoint, data, 5 * 60 * 1000) // 5 minutos
        }
      } catch (error) {
        console.warn(`No se pudo pre-cachear: ${endpoint}`)
      }
    }
  }

  private static async ensureServiceWorkerRegistered() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('✅ Service Worker registrado:', registration)
        
        // Verificar si hay actualizaciones
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Nueva versión del Service Worker disponible')
        })
        
      } catch (error) {
        errorTracker.logError({
          message: 'Error al registrar Service Worker',
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }
  }

  private static async preloadCriticalResources() {
    const criticalRoutes = [
      '/admin/dashboard',
      '/admin/empleados',
      '/admin/dashboard/live'
    ]

    // Preload con link prefetch
    criticalRoutes.forEach(route => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = route
      document.head.appendChild(link)
    })

    // Preload fonts críticas
    const fonts = [
      '/fonts/inter-latin-400-normal.woff2',
      '/fonts/inter-latin-500-normal.woff2',
      '/fonts/inter-latin-600-normal.woff2'
    ]

    fonts.forEach(font => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = font
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }

  private static setupPerformanceListeners() {
    // Detectar páginas lentas
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
      
      if (loadTime > 3000) { // Más de 3 segundos
        errorTracker.logWarning(`Página cargó lentamente: ${loadTime}ms`, {
          url: window.location.href,
          loadTime
        })
      }
    })

    // Detectar errores de recursos
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const element = event.target as HTMLElement
        errorTracker.logError({
          message: `Recurso falló al cargar: ${element.tagName}`,
          context: {
            tagName: element.tagName,
            src: (element as any).src || (element as any).href,
            type: 'resource-error'
          }
        })
      }
    }, true)

    // Monitorear uso de memoria (si está disponible)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          errorTracker.logWarning('Alto uso de memoria detectado', {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          })
        }
      }, 60000) // Cada minuto
    }
  }

  private static setupAutomaticCleanup() {
    // Limpiar cache cada 30 minutos
    setInterval(() => {
      const stats = memoryCache.getStats()
      console.log('🧹 Limpieza automática de cache:', stats)
      
      if (stats.size > 100) { // Si hay más de 100 elementos
        memoryCache.clear()
        errorTracker.logInfo('Cache limpiado automáticamente', { reason: 'size_limit', stats })
      }
    }, 30 * 60 * 1000)

    // Limpiar errores antiguos cada hora
    setInterval(() => {
      const errorStats = errorTracker.getStats()
      if (errorStats.total > 200) { // Si hay más de 200 errores
        errorTracker.clearErrors()
        errorTracker.logInfo('Log de errores limpiado automáticamente', { 
          reason: 'size_limit', 
          stats: errorStats 
        })
      }
    }, 60 * 60 * 1000)

    // Cleanup al cerrar la página
    window.addEventListener('beforeunload', () => {
      // Enviar métricas finales
      performanceMonitor.trackCustomMetric('page_unload', performance.now())
      
      // Guardar estado antes de cerrar
      const finalStats = {
        performance: performanceMonitor.getStats(),
        errors: errorTracker.getStats(),
        cache: memoryCache.getStats()
      }
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app-final-stats', JSON.stringify(finalStats))
      }
    })
  }

  static getSystemHealth() {
    return {
      initialized: this.initialized,
      performance: performanceMonitor.getStats(),
      errors: errorTracker.getStats(),
      cache: memoryCache.getStats(),
      timestamp: new Date().toISOString()
    }
  }
}

// La inicialización se maneja desde AppInitializerProvider

export default AppInitializer