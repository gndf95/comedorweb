'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Info,
  RefreshCw,
  Wifi,
  WifiOff,
  Calendar,
  BarChart3,
  Bell,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DashboardData {
  timestamp: string
  turno_actual: string
  resumen: {
    accesos_hoy: number
    empleados_unicos_hoy: number
    accesos_recientes_30min: number
    empleados_recientes_30min: number
    total_empleados_activos: number
    porcentaje_asistencia: number
  }
  tendencia: {
    direccion: 'up' | 'down' | 'stable'
    accesos_ultima_hora: number
    accesos_hora_anterior: number
    cambio: number
  }
  accesos_recientes: Array<{
    id: string
    empleado: {
      codigo: string
      nombre: string
      departamento: string
    }
    fecha_acceso: string
    tiempo_relativo: string
  }>
  accesos_por_hora: Record<number, number>
  departamentos: Record<string, { total: number; empleados: number }>
  alertas: Array<{
    tipo: string
    severidad: 'info' | 'warning' | 'error'
    mensaje: string
    timestamp: string
  }>
  estado_sistema: {
    activo: boolean
    ultimo_acceso: string | null
    tiempo_sin_actividad: number | null
  }
}

export function LiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [alertasVistas, setAlertasVistas] = useState<string[]>([])

  const cargarDatos = useCallback(async () => {
    try {
      setConnected(true)
      const response = await fetch('/api/dashboard/tiempo-real')
      const datos = await response.json()
      
      if (response.ok) {
        setData(datos)
        setUltimaActualizacion(new Date())
      } else {
        console.error('Error en respuesta:', datos)
        setConnected(false)
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(cargarDatos, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [autoRefresh, cargarDatos])

  const marcarAlertaComoVista = (alertaId: string) => {
    setAlertasVistas(prev => [...prev, alertaId])
  }

  const alertasNoVistas = data?.alertas.filter(alerta => 
    !alertasVistas.includes(`${alerta.tipo}-${alerta.timestamp}`)
  ) || []

  const getTendenciaIcon = (direccion: string) => {
    switch (direccion) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTendenciaColor = (direccion: string) => {
    switch (direccion) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200'
      case 'down': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityColor = (severidad: string) => {
    switch (severidad) {
      case 'error': return 'border-red-500 bg-red-50'
      case 'warning': return 'border-yellow-500 bg-yellow-50'
      case 'info': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const getSeverityIcon = (severidad: string) => {
    switch (severidad) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'info': return <Info className="w-4 h-4 text-blue-600" />
      default: return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Cargando dashboard en tiempo real...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Error al cargar los datos</p>
        <Button onClick={cargarDatos} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {connected ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${connected ? 'text-green-600' : 'text-red-600'}`}>
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {ultimaActualizacion && (
            <span className="text-sm text-gray-500">
              Última actualización: {ultimaActualizacion.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={cargarDatos}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alertas */}
      <AnimatePresence>
        {alertasNoVistas.map((alerta) => (
          <motion.div
            key={`${alerta.tipo}-${alerta.timestamp}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alerta.severidad)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getSeverityIcon(alerta.severidad)}
                <p className="text-sm font-medium">{alerta.mensaje}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => marcarAlertaComoVista(`${alerta.tipo}-${alerta.timestamp}`)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accesos Hoy</p>
                  <p className="text-3xl font-bold text-blue-600">{data.resumen.accesos_hoy}</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTendenciaColor(data.tendencia.direccion)}`}>
                    {getTendenciaIcon(data.tendencia.direccion)}
                    <span className="ml-1">
                      {data.tendencia.cambio > 0 ? '+' : ''}{data.tendencia.cambio} última hora
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Empleados Únicos</p>
                  <p className="text-3xl font-bold text-green-600">{data.resumen.empleados_unicos_hoy}</p>
                  <p className="text-xs text-gray-500">
                    {data.resumen.porcentaje_asistencia}% del total activos
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Últimos 30 min</p>
                  <p className="text-3xl font-bold text-orange-600">{data.resumen.accesos_recientes_30min}</p>
                  <p className="text-xs text-gray-500">
                    {data.resumen.empleados_recientes_30min} empleados únicos
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Turno Actual</p>
                  <p className="text-2xl font-bold text-purple-600">{data.turno_actual}</p>
                  {data.estado_sistema.tiempo_sin_actividad !== null && (
                    <p className="text-xs text-gray-500">
                      Sin actividad: {data.estado_sistema.tiempo_sin_actividad} min
                    </p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accesos recientes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Actividad Reciente
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {data.accesos_recientes.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {data.accesos_recientes.length > 0 ? (
                  data.accesos_recientes.map((acceso, index) => (
                    <motion.div
                      key={acceso.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {acceso.empleado.nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {acceso.empleado.codigo} • {acceso.empleado.departamento}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">
                          {acceso.tiempo_relativo}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay actividad reciente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Departamentos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data.departamentos)
                  .sort(([,a], [,b]) => b.total - a.total)
                  .map(([dept, stats]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dept}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.empleados} empleados únicos
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {stats.total}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico de actividad por hora */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Actividad por Hora - Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-1 h-32">
              {Object.entries(data.accesos_por_hora).map(([hora, accesos]) => {
                const maxAccesos = Math.max(...Object.values(data.accesos_por_hora))
                const altura = maxAccesos > 0 ? (accesos / maxAccesos) * 100 : 0
                const horaNum = parseInt(hora)
                const horaActual = new Date().getHours()
                const esHoraActual = horaNum === horaActual
                
                return (
                  <div key={hora} className="flex flex-col items-center">
                    <div className="flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          esHoraActual ? 'bg-blue-600' : 'bg-blue-400'
                        } ${esHoraActual ? 'ring-2 ring-blue-300' : ''}`}
                        style={{ height: `${Math.max(altura, 2)}%` }}
                        title={`${hora}:00 - ${accesos} accesos`}
                      ></div>
                    </div>
                    <span className={`text-xs mt-1 ${
                      esHoraActual ? 'font-bold text-blue-600' : 'text-gray-500'
                    }`}>
                      {hora}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}