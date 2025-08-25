'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePerformanceTracking } from '@/lib/performance-monitoring'
import { useErrorTracker } from '@/lib/error-tracking'

export function PerformanceStats() {
  const { getMetrics, getWebVitals, getStats } = usePerformanceTracking()
  const errorTracker = useErrorTracker()
  const [stats, setStats] = useState<any>(null)
  const [webVitals, setWebVitals] = useState<any>(null)
  const [errorStats, setErrorStats] = useState<any>(null)

  const updateStats = () => {
    setStats(getStats())
    setWebVitals(getWebVitals())
    setErrorStats(errorTracker.getStats())
  }

  useEffect(() => {
    updateStats()
    const interval = setInterval(updateStats, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  if (!stats || !webVitals || !errorStats) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const getVitalStatus = (vital: string, value: number | null) => {
    if (value === null) return 'loading'
    
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    }
    
    const threshold = thresholds[vital as keyof typeof thresholds]
    if (!threshold) return 'unknown'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500'
      case 'needs-improvement': return 'text-yellow-500'
      case 'poor': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4" />
      case 'poor': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Rendimiento del Sistema
        </h2>
        <Button onClick={updateStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(webVitals).map(([vital, value]) => {
          const status = getVitalStatus(vital, value as number)
          const statusColor = getStatusColor(status)
          const statusIcon = getStatusIcon(status)
          
          return (
            <motion.div
              key={vital}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {vital}
                    </span>
                    <span className={statusColor}>
                      {statusIcon}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {value !== null ? (
                      vital === 'CLS' ? 
                        value.toFixed(3) : 
                        `${Math.round(value)}ms`
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  
                  <div className={`text-xs ${statusColor} capitalize mt-1`}>
                    {status === 'good' ? 'Excelente' :
                     status === 'needs-improvement' ? 'Mejorable' :
                     status === 'poor' ? 'Necesita mejoras' : 'Cargando...'}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tiempo Promedio de Carga
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averagePageLoad ? `${Math.round(stats.averagePageLoad)}ms` : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                Páginas cargadas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Métricas Recientes
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.last5minutes}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 5 minutos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Errores Totales
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${
                errorStats.unresolved > 0 ? 'text-red-500' : 'text-green-500'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {errorStats.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {errorStats.unresolved} sin resolver
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Errores Recientes
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {errorStats.last24h}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recursos más lentos */}
      {stats.slowestResources && stats.slowestResources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recursos más Lentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.slowestResources.slice(0, 5).map((resource: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {resource.context?.resource?.split('/').pop() || 'Recurso desconocido'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {resource.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Math.round(resource.value)}ms
                      </p>
                      {resource.context?.size && (
                        <p className="text-xs text-gray-500">
                          {(resource.context.size / 1024).toFixed(1)}KB
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default PerformanceStats