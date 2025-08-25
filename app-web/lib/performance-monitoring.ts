'use client'

interface PerformanceMetric {
  id: string
  timestamp: string
  type: 'navigation' | 'resource' | 'paint' | 'custom'
  name: string
  value: number
  url: string
  context?: Record<string, any>
}

interface WebVitals {
  CLS: number | null  // Cumulative Layout Shift
  FID: number | null  // First Input Delay
  FCP: number | null  // First Contentful Paint
  LCP: number | null  // Largest Contentful Paint
  TTFB: number | null // Time to First Byte
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private webVitals: WebVitals = {
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null
  }

  private constructor() {
    this.setupPerformanceObserver()
    this.trackWebVitals()
    this.setupPageLoadMetrics()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    // Observer para navigation timing
    if (PerformanceObserver.supportedEntryTypes?.includes('navigation')) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming
          
          this.recordMetric({
            type: 'navigation',
            name: 'page_load_time',
            value: navEntry.loadEventEnd - navEntry.navigationStart,
            context: {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
              firstByte: navEntry.responseStart - navEntry.navigationStart,
              domComplete: navEntry.domComplete - navEntry.navigationStart,
              type: navEntry.type
            }
          })
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
    }

    // Observer para resource timing
    if (PerformanceObserver.supportedEntryTypes?.includes('resource')) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Solo trackear recursos importantes
          if (this.isImportantResource(resourceEntry.name)) {
            this.recordMetric({
              type: 'resource',
              name: this.getResourceType(resourceEntry.name),
              value: resourceEntry.responseEnd - resourceEntry.startTime,
              context: {
                size: resourceEntry.transferSize || resourceEntry.encodedBodySize,
                cached: resourceEntry.transferSize === 0,
                resource: resourceEntry.name
              }
            })
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
    }

    // Observer para paint timing
    if (PerformanceObserver.supportedEntryTypes?.includes('paint')) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            type: 'paint',
            name: entry.name,
            value: entry.startTime
          })

          if (entry.name === 'first-contentful-paint') {
            this.webVitals.FCP = entry.startTime
          }
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
    }
  }

  private trackWebVitals() {
    if (typeof window === 'undefined') return

    // LCP (Largest Contentful Paint)
    if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.webVitals.LCP = lastEntry.startTime
        
        this.recordMetric({
          type: 'paint',
          name: 'largest_contentful_paint',
          value: lastEntry.startTime,
          context: {
            element: lastEntry.element?.tagName || 'unknown',
            url: lastEntry.url || 'N/A'
          }
        })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    }

    // FID (First Input Delay)
    if (PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
      const fidObserver = new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0] as any
        this.webVitals.FID = firstInput.processingStart - firstInput.startTime
        
        this.recordMetric({
          type: 'custom',
          name: 'first_input_delay',
          value: this.webVitals.FID,
          context: {
            eventType: firstInput.name,
            target: firstInput.target?.tagName || 'unknown'
          }
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    }

    // CLS (Cumulative Layout Shift)
    if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        this.webVitals.CLS = clsValue
        
        if (clsValue > 0) {
          this.recordMetric({
            type: 'custom',
            name: 'cumulative_layout_shift',
            value: clsValue
          })
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  private setupPageLoadMetrics() {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      // TTFB usando Navigation Timing
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navTiming) {
        this.webVitals.TTFB = navTiming.responseStart - navTiming.requestStart
        
        this.recordMetric({
          type: 'navigation',
          name: 'time_to_first_byte',
          value: this.webVitals.TTFB
        })
      }
    })
  }

  private recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp' | 'url'>) {
    const fullMetric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      ...metric
    }

    this.metrics.push(fullMetric)
    
    // Mantener solo las últimas 200 métricas
    if (this.metrics.length > 200) {
      this.metrics = this.metrics.slice(-200)
    }

    // Enviar a servidor si es crítico
    if (this.isCriticalMetric(fullMetric)) {
      this.sendMetricToServer(fullMetric)
    }

    console.log('[Performance]', fullMetric)
  }

  private isCriticalMetric(metric: PerformanceMetric): boolean {
    const criticalThresholds = {
      page_load_time: 3000,
      largest_contentful_paint: 2500,
      first_input_delay: 100,
      cumulative_layout_shift: 0.1,
      time_to_first_byte: 600
    }

    const threshold = criticalThresholds[metric.name as keyof typeof criticalThresholds]
    return threshold ? metric.value > threshold : false
  }

  private async sendMetricToServer(metric: PerformanceMetric) {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.error('Failed to send performance metric:', error)
    }
  }

  private isImportantResource(url: string): boolean {
    const important = ['.js', '.css', '.png', '.jpg', '.svg', '.woff']
    return important.some(ext => url.includes(ext))
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
    return 'other'
  }

  // Método público para trackear métricas personalizadas
  public trackCustomMetric(name: string, value: number, context?: Record<string, any>) {
    this.recordMetric({
      type: 'custom',
      name,
      value,
      context
    })
  }

  public getMetrics(type?: PerformanceMetric['type']): PerformanceMetric[] {
    if (type) {
      return this.metrics.filter(m => m.type === type)
    }
    return [...this.metrics]
  }

  public getWebVitals(): WebVitals {
    return { ...this.webVitals }
  }

  public getStats() {
    const now = Date.now()
    const last5min = this.metrics.filter(m => 
      now - new Date(m.timestamp).getTime() < 5 * 60 * 1000
    )

    const avgPageLoad = this.calculateAverage(
      this.metrics.filter(m => m.name === 'page_load_time').map(m => m.value)
    )

    return {
      totalMetrics: this.metrics.length,
      last5minutes: last5min.length,
      averagePageLoad: avgPageLoad,
      webVitals: this.webVitals,
      slowestResources: this.metrics
        .filter(m => m.type === 'resource')
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Hook para usar el monitor de performance
import { useEffect, useCallback } from 'react'

export function usePerformanceTracking() {
  const monitor = PerformanceMonitor.getInstance()

  const trackCustomMetric = useCallback((name: string, value: number, context?: Record<string, any>) => {
    monitor.trackCustomMetric(name, value, context)
  }, [monitor])

  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    monitor.trackCustomMetric(`component_render_${componentName}`, renderTime, {
      component: componentName
    })
  }, [monitor])

  useEffect(() => {
    const startTime = performance.now()
    return () => {
      const renderTime = performance.now() - startTime
      if (renderTime > 16) { // Solo trackear renders lentos (>16ms)
        trackCustomMetric('slow_component_render', renderTime)
      }
    }
  }, [trackCustomMetric])

  return {
    trackCustomMetric,
    trackComponentRender,
    getMetrics: () => monitor.getMetrics(),
    getWebVitals: () => monitor.getWebVitals(),
    getStats: () => monitor.getStats()
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
export default PerformanceMonitor