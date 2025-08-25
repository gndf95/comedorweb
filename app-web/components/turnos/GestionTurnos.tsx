'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertCircle, CheckCircle, XCircle, Settings, Calendar, Users, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Turno {
  id: string
  turno: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
  descripcion: string
  fecha_creacion: string
  fecha_actualizacion: string
}

interface EstadoTurno {
  turno: Turno
  estado: 'inactivo' | 'proximo' | 'activo' | 'finalizado'
  tiempoRestante?: number
  proximoInicio?: number
  progreso: number
}

interface Estadisticas {
  totalRegistros: number
  porTurno: {
    [key: string]: {
      empleados: number
      externos: number
      total: number
    }
  }
  ultimaActualizacion: string
}

export default function GestionTurnos() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [estadosTurnos, setEstadosTurnos] = useState<EstadoTurno[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [horaActual, setHoraActual] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Cargar turnos configurados
  useEffect(() => {
    cargarTurnos()
  }, [])

  // Calcular estados cuando cambie la hora o los turnos
  useEffect(() => {
    if (turnos.length > 0) {
      calcularEstadosTurnos()
    }
  }, [horaActual, turnos])

  // Cargar estadísticas cada 30 segundos
  useEffect(() => {
    cargarEstadisticas()
    const interval = setInterval(cargarEstadisticas, 30000)
    return () => clearInterval(interval)
  }, [])

  const cargarTurnos = async () => {
    try {
      const response = await fetch('/api/turnos/configuracion')
      const data = await response.json()

      if (data.success) {
        setTurnos(data.turnos)
        setError(null)
      } else {
        setError('Error cargando configuración de turnos')
      }
    } catch (err) {
      setError('Error conectando con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch('/api/estadisticas/turnos')
      const data = await response.json()

      if (data.success) {
        setEstadisticas(data.estadisticas)
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    }
  }

  const calcularEstadosTurnos = () => {
    const ahora = horaActual
    const horaActualStr = ahora.toTimeString().split(' ')[0] // HH:MM:SS

    const nuevosEstados: EstadoTurno[] = turnos.map(turno => {
      if (!turno.activo) {
        return {
          turno,
          estado: 'inactivo',
          progreso: 0
        }
      }

      const inicio = timeStringToMinutes(turno.hora_inicio)
      const fin = timeStringToMinutes(turno.hora_fin)
      const actual = timeStringToMinutes(horaActualStr)

      // Turno activo
      if (actual >= inicio && actual <= fin) {
        const duracionTotal = fin - inicio
        const transcurrido = actual - inicio
        const progreso = Math.min((transcurrido / duracionTotal) * 100, 100)
        const tiempoRestante = fin - actual

        return {
          turno,
          estado: 'activo',
          tiempoRestante,
          progreso
        }
      }

      // Turno próximo (dentro de las próximas 2 horas)
      if (actual < inicio && inicio - actual <= 120) {
        const proximoInicio = inicio - actual
        return {
          turno,
          estado: 'proximo',
          proximoInicio,
          progreso: 0
        }
      }

      // Turno finalizado
      if (actual > fin) {
        return {
          turno,
          estado: 'finalizado',
          progreso: 100
        }
      }

      // Turno inactivo (muy lejano)
      return {
        turno,
        estado: 'inactivo',
        progreso: 0
      }
    })

    setEstadosTurnos(nuevosEstados)
  }

  const timeStringToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTimeString = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const formatTiempoRestante = (minutos: number): string => {
    if (minutos < 60) {
      return `${minutos}m`
    }
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}m`
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-500'
      case 'proximo': return 'bg-yellow-500'
      case 'finalizado': return 'bg-gray-500'
      default: return 'bg-gray-300'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'proximo': return <Clock className="w-5 h-5 text-yellow-600" />
      case 'finalizado': return <XCircle className="w-5 h-5 text-gray-600" />
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <Button 
            onClick={cargarTurnos} 
            className="mt-4"
            variant="outline"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con hora actual */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Turnos</h2>
          <p className="text-gray-600">
            {horaActual.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-blue-600">
            {horaActual.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            })}
          </div>
          <p className="text-sm text-gray-500">Hora actual</p>
        </div>
      </div>

      {/* Grid de turnos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence>
          {estadosTurnos.map((estadoTurno) => (
            <motion.div
              key={estadoTurno.turno.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`border-2 ${
                estadoTurno.estado === 'activo' 
                  ? 'border-green-200 shadow-green-100 shadow-lg' 
                  : estadoTurno.estado === 'proximo'
                  ? 'border-yellow-200 shadow-yellow-100 shadow-lg'
                  : 'border-gray-200'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {estadoTurno.turno.turno}
                    </CardTitle>
                    {getEstadoIcon(estadoTurno.estado)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {estadoTurno.turno.descripcion}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Horario */}
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      {estadoTurno.turno.hora_inicio} - {estadoTurno.turno.hora_fin}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progreso</span>
                      <span>{Math.round(estadoTurno.progreso)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${getEstadoColor(estadoTurno.estado)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${estadoTurno.progreso}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Estado y tiempo */}
                  <div className="space-y-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      estadoTurno.estado === 'activo' 
                        ? 'bg-green-100 text-green-800' 
                        : estadoTurno.estado === 'proximo'
                        ? 'bg-yellow-100 text-yellow-800'
                        : estadoTurno.estado === 'finalizado'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      {estadoTurno.estado.toUpperCase()}
                    </div>

                    {estadoTurno.tiempoRestante && (
                      <p className="text-sm text-gray-600">
                        Finaliza en: <span className="font-medium">
                          {formatTiempoRestante(estadoTurno.tiempoRestante)}
                        </span>
                      </p>
                    )}

                    {estadoTurno.proximoInicio && (
                      <p className="text-sm text-gray-600">
                        Inicia en: <span className="font-medium">
                          {formatTiempoRestante(estadoTurno.proximoInicio)}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Estadísticas del turno */}
                  {estadisticas && estadisticas.porTurno[estadoTurno.turno.turno] && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>Registros hoy:</span>
                        </div>
                        <span className="font-medium">
                          {estadisticas.porTurno[estadoTurno.turno.turno].total}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Resumen estadísticas */}
      {estadisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Resumen del Día</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {estadisticas.totalRegistros}
                </div>
                <div className="text-sm text-gray-600">Total Registros</div>
              </div>

              {Object.entries(estadisticas.porTurno).map(([turno, stats]) => (
                <div key={turno} className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600">{turno}</div>
                  <div className="text-xs text-gray-400">
                    {stats.empleados}E • {stats.externos}Ex
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t text-center text-xs text-gray-500">
              Última actualización: {new Date(estadisticas.ultimaActualizacion).toLocaleTimeString('es-ES')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón de configuración */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          className="flex items-center space-x-2"
          onClick={() => {/* TODO: Abrir modal de configuración */}}
        >
          <Settings className="w-4 h-4" />
          <span>Configurar Turnos</span>
        </Button>
      </div>
    </div>
  )
}