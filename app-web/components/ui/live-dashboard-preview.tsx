'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface LiveDataPreview {
  resumen: {
    accesos_hoy: number
    empleados_unicos_hoy: number
    accesos_recientes_30min: number
    porcentaje_asistencia: number
  }
  tendencia: {
    direccion: 'up' | 'down' | 'stable'
    cambio: number
  }
  turno_actual: string
  accesos_recientes: Array<{
    id: string
    empleado: {
      nombre: string
      codigo: string
    }
    tiempo_relativo: string
  }>
}

export function LiveDashboardPreview() {
  const [data, setData] = useState<LiveDataPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const router = useRouter()

  const loadData = async () => {
    try {
      const response = await fetch('/api/dashboard/tiempo-real')
      const datos = await response.json()
      
      if (response.ok) {
        setData(datos)
        setConnected(true)
      } else {
        setConnected(false)
      }
    } catch (error) {
      console.error('Error cargando vista previa:', error)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000) // Actualizar cada minuto
    return () => clearInterval(interval)
  }, [])

  const getTendenciaIcon = (direccion: string) => {
    switch (direccion) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-600" />
      case 'down': return <TrendingDown className="w-3 h-3 text-red-600" />
      default: return <Minus className="w-3 h-3 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Vista en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !connected) {
    return (
      <Card className="border-2 border-red-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Vista en Tiempo Real
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/dashboard/live')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Error al cargar datos en tiempo real</p>
            <Button variant="outline" size="sm" onClick={loadData} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 hover:shadow-lg transition-all">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Vista en Tiempo Real
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </CardTitle>
            <Button
              onClick={() => router.push('/admin/dashboard/live')}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{data.resumen.accesos_hoy}</p>
                <p className="text-xs text-gray-600">Accesos Hoy</p>
                <div className="flex items-center justify-center mt-1">
                  {getTendenciaIcon(data.tendencia.direccion)}
                  <span className="text-xs ml-1">
                    {data.tendencia.cambio > 0 ? '+' : ''}{data.tendencia.cambio}
                  </span>
                </div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{data.resumen.empleados_unicos_hoy}</p>
                <p className="text-xs text-gray-600">Empleados</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.resumen.porcentaje_asistencia}% asistencia
                </p>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-lg font-bold text-orange-600">{data.resumen.accesos_recientes_30min}</p>
                <p className="text-xs text-gray-600">Últimos 30min</p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-bold text-purple-600">{data.turno_actual}</p>
                <p className="text-xs text-gray-600">Turno Actual</p>
              </div>
            </div>

            {/* Actividad reciente */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Actividad Reciente
              </h4>
              
              {data.accesos_recientes.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {data.accesos_recientes.slice(0, 4).map((acceso) => (
                    <div key={acceso.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{acceso.empleado.nombre}</span>
                        <span className="text-gray-500 text-xs">({acceso.empleado.codigo})</span>
                      </div>
                      <span className="text-gray-500 text-xs">{acceso.tiempo_relativo}</span>
                    </div>
                  ))}
                  
                  {data.accesos_recientes.length > 4 && (
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/admin/dashboard/live')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Ver {data.accesos_recientes.length - 4} más...
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-4">
                  No hay actividad reciente
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default LiveDashboardPreview