'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  BarChart3, Users, Clock, Settings, FileText, QrCode, 
  Shield, Database, Activity, PieChart, Calendar, 
  LogOut, Bell, Home, Zap 
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import NotificacionesTurnos from '@/components/notificaciones/NotificacionesTurnos'

interface MetricaAdmin {
  titulo: string
  valor: string | number
  cambio: string
  tipo: 'positivo' | 'negativo' | 'neutro'
  icono: React.ReactNode
}

interface AccesoRapido {
  titulo: string
  descripcion: string
  href: string
  icono: React.ReactNode
  color: string
  destacado?: boolean
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [metricas, setMetricas] = useState<MetricaAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [horaActual, setHoraActual] = useState(new Date())

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, router])

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Cargar métricas al montar
  useEffect(() => {
    if (user && isAdmin) {
      cargarMetricas()
    }
  }, [user, isAdmin])

  const cargarMetricas = async () => {
    try {
      // Simular carga de métricas desde múltiples APIs
      const [estadisticas, usuarios, turnos] = await Promise.all([
        fetch('/api/estadisticas/turnos').then(r => r.json()),
        fetch('/api/verificar-datos').then(r => r.json()),
        fetch('/api/turnos/actual').then(r => r.json())
      ])

      const nuevasMetricas: MetricaAdmin[] = [
        {
          titulo: 'Registros Hoy',
          valor: estadisticas.success ? estadisticas.estadisticas.totalRegistros : 0,
          cambio: '+12%',
          tipo: 'positivo',
          icono: <Activity className="w-6 h-6" />
        },
        {
          titulo: 'Usuarios Activos',
          valor: usuarios.success ? usuarios.resumen.totalUsuarios : 0,
          cambio: '+3',
          tipo: 'positivo',
          icono: <Users className="w-6 h-6" />
        },
        {
          titulo: 'Turno Actual',
          valor: turnos.success && turnos.turno ? turnos.turno.turno : 'N/A',
          cambio: turnos.success && turnos.turno?.activo ? 'Activo' : 'Inactivo',
          tipo: turnos.success && turnos.turno?.activo ? 'positivo' : 'neutro',
          icono: <Clock className="w-6 h-6" />
        },
        {
          titulo: 'Sistema',
          valor: 'Operativo',
          cambio: '99.9%',
          tipo: 'positivo',
          icono: <Zap className="w-6 h-6" />
        }
      ]

      setMetricas(nuevasMetricas)
    } catch (error) {
      console.error('Error cargando métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const accesosRapidos: AccesoRapido[] = [
    {
      titulo: 'Gestión de Turnos',
      descripcion: 'Configurar horarios, estados y excepciones',
      href: '/admin/turnos',
      icono: <Clock className="w-6 h-6" />,
      color: 'bg-blue-500',
      destacado: true
    },
    {
      titulo: 'Gestión de Usuarios',
      descripcion: 'CRUD de empleados y códigos de barras',
      href: '/admin/empleados',
      icono: <Users className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      titulo: 'Reportes y Estadísticas',
      descripcion: 'Análisis detallados y exportación de datos',
      href: '/admin/reportes',
      icono: <BarChart3 className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      titulo: 'Registros de Acceso',
      descripcion: 'Historial completo de entradas al comedor',
      href: '/admin/registros',
      icono: <FileText className="w-6 h-6" />,
      color: 'bg-orange-500'
    },
    {
      titulo: 'Códigos de Barras',
      descripcion: 'Generar y administrar códigos QR/barras',
      href: '/admin/codigos',
      icono: <QrCode className="w-6 h-6" />,
      color: 'bg-indigo-500'
    },
    {
      titulo: 'Configuración Sistema',
      descripcion: 'Ajustes generales y mantenimiento',
      href: '/admin/configuracion',
      icono: <Settings className="w-6 h-6" />,
      color: 'bg-gray-500'
    },
    {
      titulo: 'Auditoría y Logs',
      descripcion: 'Seguimiento de actividades del sistema',
      href: '/admin/auditoria',
      icono: <Shield className="w-6 h-6" />,
      color: 'bg-red-500'
    },
    {
      titulo: 'Mantenimiento',
      descripcion: 'Herramientas de diagnóstico y backup',
      href: '/admin/mantenimiento',
      icono: <Database className="w-6 h-6" />,
      color: 'bg-yellow-500'
    }
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tiene permisos para acceder al panel administrativo.</p>
          <Button onClick={() => router.push('/login')}>Iniciar Sesión</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notificaciones en tiempo real */}
      <NotificacionesTurnos 
        habilitado={true}
        sonidoHabilitado={true}
        posicion="top-right"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Panel Administrativo
            </h1>
            <p className="text-gray-600">
              {horaActual.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-blue-600">
                {horaActual.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </div>
              <p className="text-sm text-gray-500">Hora actual</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/kiosco">
                  <Home className="w-4 h-4 mr-2" />
                  Kiosco
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="accesos" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Accesos Rápidos</span>
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="actividad" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Actividad</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                metricas.map((metrica, index) => (
                  <motion.div
                    key={metrica.titulo}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-2 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              {metrica.titulo}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {metrica.valor}
                            </p>
                            <p className={`text-xs ${
                              metrica.tipo === 'positivo' ? 'text-green-600' :
                              metrica.tipo === 'negativo' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {metrica.cambio}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full ${
                            metrica.tipo === 'positivo' ? 'bg-green-100 text-green-600' :
                            metrica.tipo === 'negativo' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {metrica.icono}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Gráficos y estadísticas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5" />
                    <span>Uso por Turno (Hoy)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    [Gráfico de uso por turno]
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Actividad Reciente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Sistema iniciado correctamente</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Turno COMIDA activado</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">3 registros procesados</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accesos Rápidos Tab */}
          <TabsContent value="accesos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {accesosRapidos.map((acceso, index) => (
                  <motion.div
                    key={acceso.titulo}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Link href={acceso.href}>
                      <Card className={`border-2 hover:shadow-xl transition-all cursor-pointer ${
                        acceso.destacado ? 'ring-2 ring-blue-200 bg-blue-50' : ''
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`${acceso.color} text-white p-2 rounded-lg`}>
                              {acceso.icono}
                            </div>
                            <CardTitle className="text-lg">
                              {acceso.titulo}
                              {acceso.destacado && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Nuevo
                                </span>
                              )}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600">{acceso.descripcion}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Sistema Tab */}
          <TabsContent value="sistema" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Base de datos</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Conectado</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Scanner USB</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Operativo</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Notificaciones</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Activas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Versión:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base de datos:</span>
                    <span>PostgreSQL (Supabase)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuarios totales:</span>
                    <span>{metricas.find(m => m.titulo === 'Usuarios Activos')?.valor || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última actualización:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Actividad Tab */}
          <TabsContent value="actividad" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Log de Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Los logs de actividad se mostrarán aquí</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}