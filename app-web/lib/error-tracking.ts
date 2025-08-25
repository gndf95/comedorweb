'use client'

export interface ErrorLog {
  id: string
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  stack?: string
  url: string
  userAgent: string
  userId?: string
  context?: Record<string, any>
  resolved?: boolean
}

class ErrorTracker {
  private static instance: ErrorTracker
  private errors: ErrorLog[] = []
  private maxErrors = 100
  private apiEndpoint = '/api/logs'

  private constructor() {
    this.setupGlobalErrorHandlers()
    this.loadStoredErrors()
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return

    // Errores JavaScript no capturados
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript-error'
        }
      })
    })

    // Promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: {
          type: 'promise-rejection',
          reason: event.reason
        }
      })
    })

    // Errores de recursos (imágenes, scripts, etc.)
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement
      if (target !== window && target.tagName) {
        this.logError({
          message: `Resource failed to load: ${target.tagName}`,
          context: {
            type: 'resource-error',
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
            currentSrc: (target as any).currentSrc
          }
        })
      }
    }, true)
  }

  logError(error: Partial<ErrorLog> & { message: string }) {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      resolved: false,
      ...error
    }

    this.errors.unshift(errorLog)
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    this.storeErrors()
    this.sendToServer(errorLog)

    console.error('[ErrorTracker]', errorLog)
  }

  logWarning(message: string, context?: Record<string, any>) {
    this.logError({
      message,
      level: 'warn',
      context
    })
  }

  logInfo(message: string, context?: Record<string, any>) {
    this.logError({
      message,
      level: 'info',
      context
    })
  }

  logDebug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      this.logError({
        message,
        level: 'debug',
        context
      })
    }
  }

  private async sendToServer(error: ErrorLog) {
    if (typeof window === 'undefined') return

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      })
    } catch (err) {
      console.error('Failed to send error to server:', err)
      // Intentar enviar más tarde
      this.scheduleRetry(error)
    }
  }

  private scheduleRetry(error: ErrorLog) {
    setTimeout(() => {
      this.sendToServer(error)
    }, 5000) // Reintentar después de 5 segundos
  }

  private storeErrors() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('error-logs', JSON.stringify(this.errors.slice(0, 50)))
    } catch (err) {
      console.error('Failed to store errors:', err)
    }
  }

  private loadStoredErrors() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('error-logs')
      if (stored) {
        this.errors = JSON.parse(stored)
      }
    } catch (err) {
      console.error('Failed to load stored errors:', err)
    }
  }

  getErrors(level?: ErrorLog['level']): ErrorLog[] {
    if (level) {
      return this.errors.filter(error => error.level === level)
    }
    return [...this.errors]
  }

  clearErrors() {
    this.errors = []
    this.storeErrors()
  }

  markResolved(errorId: string) {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      this.storeErrors()
    }
  }

  getStats() {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recent = this.errors.filter(e => new Date(e.timestamp) > last24h)
    const weekly = this.errors.filter(e => new Date(e.timestamp) > last7d)

    return {
      total: this.errors.length,
      last24h: recent.length,
      last7d: weekly.length,
      byLevel: {
        error: this.errors.filter(e => e.level === 'error').length,
        warn: this.errors.filter(e => e.level === 'warn').length,
        info: this.errors.filter(e => e.level === 'info').length,
        debug: this.errors.filter(e => e.level === 'debug').length
      },
      resolved: this.errors.filter(e => e.resolved).length,
      unresolved: this.errors.filter(e => !e.resolved).length
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Instancia singleton para usar directamente
export function useErrorTracker() {
  return ErrorTracker.getInstance()
}

// Funciones de utilidad
export const errorTracker = ErrorTracker.getInstance()

export function captureError(error: Error | string, context?: Record<string, any>) {
  if (typeof error === 'string') {
    errorTracker.logError({ message: error, context })
  } else {
    errorTracker.logError({
      message: error.message,
      stack: error.stack,
      context
    })
  }
}

export function captureWarning(message: string, context?: Record<string, any>) {
  errorTracker.logWarning(message, context)
}

export function captureInfo(message: string, context?: Record<string, any>) {
  errorTracker.logInfo(message, context)
}

export default ErrorTracker