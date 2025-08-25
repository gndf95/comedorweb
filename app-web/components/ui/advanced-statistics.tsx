'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  BarChart3,
  PieChart,
  CalendarDays,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EstadisticasAvanzadas {
  diarias?: any
  semanales?: any
  mensuales?: any
}

export function AdvancedStatistics() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasAvanzadas>({})
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)
  const [tipoVista, setTipoVista] = useState<'diaria' | 'semanal' | 'mensual'>('diaria')

  const cargarEstadisticas = async () => {
    setLoading(true)
    try {
      const endpoints = {
        diaria: `/api/estadisticas/accesos-diarios?fecha=${fechaSeleccionada}`,
        semanal: `/api/estadisticas/accesos-semanales?fecha=${fechaSeleccionada}`,
        mensual: `/api/estadisticas/accesos-mensuales?fecha=${fechaSeleccionada}`
      }

      const response = await fetch(endpoints[tipoVista])
      const data = await response.json()
      
      setEstadisticas(prev => ({
        ...prev,
        [tipoVista === 'diaria' ? 'diarias' : tipoVista === 'semanal' ? 'semanales' : 'mensuales']: data
      }))
    } catch (error) {
      console.error(`Error cargando estadísticas ${tipoVista}:`, error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEstadisticas()
  }, [fechaSeleccionada, tipoVista])

  const renderTurnoCard = (turno: string, datos: any, color: string) => (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{datos.total_accesos || datos.accesos || 0}</p>
            <p className="text-xs text-gray-500">accesos</p>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{datos.nombre || turno}</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Empleados únicos:</span>
            <span className="font-medium">{datos.empleados_unicos || datos.empleados || 0}</span>
          </div>
          {datos.promedio_diario !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Promedio diario:</span>
              <span className="font-medium">{datos.promedio_diario}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderEstadisticasDiarias = () => {
    const datos = estadisticas.diarias
    if (!datos || !datos.resumen) return <div>Cargando estadísticas diarias...</div>

    const coloresTurnos = {
      desayuno: 'bg-yellow-500',
      almuerzo: 'bg-blue-500',
      cena: 'bg-orange-500',
      nocturno: 'bg-purple-500',
      madrugada: 'bg-indigo-500'
    }

    return (
      <div className="space-y-6">
        {/* Resumen diario */}
        <Card className="border-2 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Resumen del día {datos.fecha}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{datos.resumen?.total_accesos || 0}</p>
                <p className="text-sm text-gray-600">Total de accesos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{datos.resumen?.empleados_unicos || 0}</p>
                <p className="text-sm text-gray-600">Empleados únicos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{datos.resumen?.turnos_activos || 0}</p>
                <p className="text-sm text-gray-600">Turnos activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas por turno */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos por Turno</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datos.por_turno && Object.entries(datos.por_turno).map(([turno, datos]: [string, any]) => (
              <motion.div
                key={turno}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {renderTurnoCard(
                  turno, 
                  datos, 
                  coloresTurnos[turno as keyof typeof coloresTurnos] || 'bg-gray-500'
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Gráfico de accesos por hora */}
        {datos.por_hora && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Distribución por Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-1 h-32">
                {Object.entries(datos.por_hora).map(([hora, accesos]: [string, any]) => {
                const maxAccesos = Math.max(...Object.values(datos.por_hora))
                const altura = maxAccesos > 0 ? (accesos / maxAccesos) * 100 : 0
                
                return (
                  <div key={hora} className="flex flex-col items-center">
                    <div className="flex-1 flex items-end">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${altura}%` }}
                        title={`${hora}:00 - ${accesos} accesos`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{hora}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Turno más activo */}
        {datos.turno_mas_activo && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-full">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Turno más activo</h3>
                  <p className="text-green-700">
                    {datos.turno_mas_activo[1].nombre} con {datos.turno_mas_activo[1].total_accesos} accesos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderEstadisticasSemanales = () => {
    const datos = estadisticas.semanales
    if (!datos || !datos.resumen) return <div>Cargando estadísticas semanales...</div>

    return (
      <div className="space-y-6">
        {/* Resumen semanal */}
        <Card className="border-2 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Semana del {datos.semana.inicio} al {datos.semana.fin}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{datos.resumen?.total_accesos || 0}</p>
                <p className="text-sm text-gray-600">Total de accesos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{datos.resumen?.empleados_unicos || 0}</p>
                <p className="text-sm text-gray-600">Empleados únicos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{datos.resumen?.promedio_diario || 0}</p>
                <p className="text-sm text-gray-600">Promedio diario</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas por día */}
        {datos.por_dia && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos por Día</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(datos.por_dia).map(([fecha, datosdia]: [string, any]) => (
              <Card key={fecha} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {datosdia.dia_semana}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">{fecha}</p>
                    <p className="text-2xl font-bold text-blue-600">{datosdia.total_accesos}</p>
                    <p className="text-xs text-gray-600">accesos</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {datosdia.empleados_unicos} empleados únicos
                    </p>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estadísticas por turno semanal */}
        {datos.por_turno && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Turnos de la Semana</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(datos.por_turno).map(([turno, datosturno]: [string, any]) => (
              <Card key={turno} className="border-2">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 capitalize">{datosturno.nombre}</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{datosturno.total_accesos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Empleados únicos:</span>
                      <span className="font-medium">{datosturno.empleados_unicos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Promedio diario:</span>
                      <span className="font-medium">{datosturno.promedio_diario}</span>
                    </div>
                    {datosturno.mejor_dia?.accesos > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">Mejor día:</span>
                          <span className="font-medium text-green-600">
                            {datosturno.mejor_dia.dia} ({datosturno.mejor_dia.accesos})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderEstadisticasMensuales = () => {
    const datos = estadisticas.mensuales
    if (!datos || !datos.resumen) return <div>Cargando estadísticas mensuales...</div>

    return (
      <div className="space-y-6">
        {/* Resumen mensual */}
        <Card className="border-2 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {datos.mes.nombre} {datos.mes.año}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{datos.resumen?.total_accesos || 0}</p>
                <p className="text-sm text-gray-600">Total accesos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{datos.resumen?.empleados_unicos || 0}</p>
                <p className="text-sm text-gray-600">Empleados únicos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{datos.resumen?.promedio_diario || 0}</p>
                <p className="text-sm text-gray-600">Promedio diario</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{datos.resumen?.dias_con_actividad || 0}</p>
                <p className="text-sm text-gray-600">Días activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas por turno mensual */}
        {datos.por_turno && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Turnos del Mes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(datos.por_turno).map(([turno, datosturno]: [string, any]) => (
              <Card key={turno} className="border-2">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 capitalize">{datosturno.nombre}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-lg">{datosturno.total_accesos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Empleados únicos:</span>
                      <span className="font-medium">{datosturno.empleados_unicos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Promedio diario:</span>
                      <span className="font-medium">{datosturno.promedio_diario}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Días activos:</span>
                      <span className="font-medium">{datosturno.dias_activos}</span>
                    </div>
                    {datosturno.mejor_dia?.accesos > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-xs">
                          <div className="flex justify-between">
                            <span className="text-green-600">Mejor día:</span>
                            <span className="font-medium text-green-600">
                              Día {datosturno.mejor_dia.dia} ({datosturno.mejor_dia.accesos})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estadísticas por departamento */}
        {datos.por_departamento && Object.keys(datos.por_departamento).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Departamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(datos.por_departamento).map(([dept, datosdept]: [string, any]) => (
                <Card key={dept} className="border-2">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{datosdept.nombre}</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total accesos:</span>
                        <span className="font-bold">{datosdept.total_accesos}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Empleados únicos:</span>
                        <span className="font-medium">{datosdept.empleados_unicos}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t">
                      <p className="text-xs text-gray-600 mb-1">Por turno:</p>
                      {Object.entries(datosdept.por_turno).map(([turno, accesos]: [string, any]) => (
                        <div key={turno} className="flex justify-between text-xs">
                          <span className="text-gray-500 capitalize">{turno}:</span>
                          <span>{accesos}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="fecha">Fecha de referencia</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={tipoVista === 'diaria' ? 'default' : 'outline'}
                onClick={() => setTipoVista('diaria')}
                disabled={loading}
              >
                Diaria
              </Button>
              <Button
                variant={tipoVista === 'semanal' ? 'default' : 'outline'}
                onClick={() => setTipoVista('semanal')}
                disabled={loading}
              >
                Semanal
              </Button>
              <Button
                variant={tipoVista === 'mensual' ? 'default' : 'outline'}
                onClick={() => setTipoVista('mensual')}
                disabled={loading}
              >
                Mensual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido de estadísticas */}
      <motion.div
        key={tipoVista}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Cargando estadísticas...</p>
            </div>
          </div>
        ) : (
          <>
            {tipoVista === 'diaria' && renderEstadisticasDiarias()}
            {tipoVista === 'semanal' && renderEstadisticasSemanales()}
            {tipoVista === 'mensual' && renderEstadisticasMensuales()}
          </>
        )}
      </motion.div>
    </div>
  )
}