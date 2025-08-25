'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  Activity,
  PieChart,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Timer,
  UserCheck,
  Utensils,
  Eye,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/ui/admin-header'
import { LiveDashboardPreview } from '@/components/ui/live-dashboard-preview'

interface MetricasResumen {
  accesos_hoy: number
  empleados_activos: number
  turnos_activos: number
  promedio_accesos_semana: number
  pico_accesos_hora: string
  turnos_completados_hoy: number
}

interface AccesosPorHora {
  hora: string
  accesos: number
}

interface AccesosPorDepartamento {
  departamento: string
  accesos: number
}

interface TurnoActual {
  id: string
  nombre: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
  accesos_actual: number
  progreso: number
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [metricas, setMetricas] = useState<MetricasResumen>({
    accesos_hoy: 0,
    empleados_activos: 0,
    turnos_activos: 0,
    promedio_accesos_semana: 0,
    pico_accesos_hora: '12:00',
    turnos_completados_hoy: 0
  })
  const [accesosPorHora, setAccesosPorHora] = useState<AccesosPorHora[]>([])
  const [accesosPorDepartamento, setAccesosPorDepartamento] = useState<AccesosPorDepartamento[]>([])
  const [turnoActual, setTurnoActual] = useState<TurnoActual | null>(null)
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())

  useEffect(() => {
    if (user && isAdmin) {
      cargarDashboard()
      const interval = setInterval(cargarDashboard, 30000) // Actualizar cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [user, isAdmin])

  const cargarDashboard = async () => {
    try {
      const [metricasRes, horasRes, departamentosRes, turnoRes] = await Promise.all([
        fetch('/api/dashboard/metricas'),
        fetch('/api/dashboard/accesos-por-hora'),
        fetch('/api/dashboard/accesos-por-departamento'),
        fetch('/api/turnos/actual')
      ])

      const [metricasData, horasData, departamentosData, turnoData] = await Promise.all([
        metricasRes.json(),
        horasRes.json(),
        departamentosRes.json(),
        turnoRes.json()
      ])

      setMetricas(metricasData)
      setAccesosPorHora(horasData)
      setAccesosPorDepartamento(departamentosData)
      setTurnoActual(turnoData)
      setUltimaActualizacion(new Date())
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarReporte = async () => {
    try {
      const response = await fetch('/api/reportes/dashboard-excel')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `dashboard-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando reporte:', error)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Acceso Denegado</h2>
            <p className="text-red-600">No tiene permisos para acceder al dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <AdminHeader
        title="Dashboard"
        subtitle="Métricas y estadísticas del sistema de comedor"
        icon={<BarChart className="w-6 h-6 text-blue-600" />}
        showBackButton={false}
        actions={
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              Última actualización: {ultimaActualizacion.toLocaleTimeString()}
            </div>
            <Button
              onClick={() => router.push('/admin/dashboard/live')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Tiempo Real
            </Button>
            <Button
              onClick={cargarDashboard}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={exportarReporte} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        }
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >

          <Tabs defaultValue="resumen" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border-2 p-1">
              <TabsTrigger value="resumen" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Activity className="w-4 h-4 mr-2" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="tiempo-real" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Timer className="w-4 h-4 mr-2" />
                Tiempo Real
              </TabsTrigger>
              <TabsTrigger value="analisis" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <PieChart className="w-4 h-4 mr-2" />
                Análisis
              </TabsTrigger>
              <TabsTrigger value="tendencias" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                Tendencias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumen">
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
                          <p className="text-3xl font-bold text-blue-600">{metricas.accesos_hoy}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Promedio semanal: {metricas.promedio_accesos_semana}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <UserCheck className="w-6 h-6 text-blue-600" />
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
                          <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
                          <p className="text-3xl font-bold text-green-600">{metricas.empleados_activos}</p>
                          <p className="text-sm text-green-500 mt-1 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            En el sistema
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
                          <p className="text-sm font-medium text-gray-600">Turnos Activos</p>
                          <p className="text-3xl font-bold text-orange-600">{metricas.turnos_activos}</p>
                          <p className="text-sm text-orange-500 mt-1">
                            Pico: {metricas.pico_accesos_hora}
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
                          <p className="text-sm font-medium text-gray-600">Turnos Completados</p>
                          <p className="text-3xl font-bold text-purple-600">{metricas.turnos_completados_hoy}</p>
                          <p className="text-sm text-purple-500 mt-1">
                            Hoy
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Utensils className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="tiempo-real">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Vista previa del dashboard en tiempo real */}
                <div className="xl:col-span-2">
                  <LiveDashboardPreview />
                </div>
                
                <div className="space-y-6">
                  <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Timer className="w-5 h-5" />
                      <span>Turno Actual</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {turnoActual ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-semibold">{turnoActual.nombre}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            turnoActual.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {turnoActual.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          <p>Horario: {turnoActual.hora_inicio} - {turnoActual.hora_fin}</p>
                          <p>Accesos actuales: {turnoActual.accesos_actual}</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${turnoActual.progreso || 0}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          Progreso: {turnoActual.progreso?.toFixed(1) || '0'}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay turnos activos</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart className="w-5 h-5" />
                      <span>Accesos por Hora</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {accesosPorHora.map((item, index) => (
                        <motion.div
                          key={item.hora}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium">{item.hora}</span>
                          <div className="flex items-center space-x-3">
                            <div 
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ 
                                width: `${Math.max(item.accesos / Math.max(...accesosPorHora.map(h => h.accesos)) * 100, 5)}px`,
                                minWidth: '20px' 
                              }}
                            />
                            <span className="text-sm font-semibold text-blue-600 w-8 text-right">
                              {item.accesos}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analisis">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="w-5 h-5" />
                      <span>Accesos por Departamento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {accesosPorDepartamento.map((dept, index) => {
                        const maxAccesos = Math.max(...accesosPorDepartamento.map(d => d.accesos))
                        const porcentaje = (dept.accesos / maxAccesos) * 100
                        
                        return (
                          <motion.div
                            key={dept.departamento}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{dept.departamento || 'Sin Departamento'}</span>
                              <span className="text-sm text-gray-600">{dept.accesos} accesos</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${porcentaje}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>Resumen Semanal</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {metricas.promedio_accesos_semana}
                        </div>
                        <div className="text-sm text-blue-700">Promedio diario</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-semibold text-green-600">
                            {metricas.pico_accesos_hora}
                          </div>
                          <div className="text-xs text-green-700">Hora pico</div>
                        </div>
                        
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="text-lg font-semibold text-orange-600">
                            {metricas.turnos_activos}
                          </div>
                          <div className="text-xs text-orange-700">Turnos configurados</div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-sm text-gray-600 space-y-2">
                          <p>• Empleados en el sistema: <strong>{metricas.empleados_activos}</strong></p>
                          <p>• Turnos completados hoy: <strong>{metricas.turnos_completados_hoy}</strong></p>
                          <p>• Accesos registrados: <strong>{metricas.accesos_hoy}</strong></p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tendencias">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Tendencias y Proyecciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Análisis de Tendencias
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Los gráficos avanzados de tendencias estarán disponibles próximamente
                    </p>
                    <Button variant="outline">
                      <BarChart className="w-4 h-4 mr-2" />
                      Ver Reportes Detallados
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}