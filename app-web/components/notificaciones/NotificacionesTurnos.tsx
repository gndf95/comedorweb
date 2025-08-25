'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Clock, AlertTriangle, CheckCircle, X, Volume2, VolumeX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Notificacion {
  id: string
  tipo: 'info' | 'warning' | 'success' | 'error'
  titulo: string
  mensaje: string
  timestamp: Date
  duracion?: number
  accion?: () => void
  sonido?: boolean
}

interface NotificacionesTurnosProps {
  habilitado?: boolean
  sonidoHabilitado?: boolean
  posicion?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export default function NotificacionesTurnos({ 
  habilitado = true,
  sonidoHabilitado = true,
  posicion = 'top-right'
}: NotificacionesTurnosProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [sonidoActivo, setSonidoActivo] = useState(sonidoHabilitado)
  const [turnoAnterior, setTurnoAnterior] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext>()
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!habilitado) return

    // Verificar cambios de turno cada 30 segundos
    const verificarCambiosTurno = async () => {
      try {
        const response = await fetch('/api/turnos/actual')
        const data = await response.json()

        if (data.success && data.turno) {
          const turnoActual = data.turno.turno

          // Detectar cambio de turno
          if (turnoAnterior && turnoAnterior !== turnoActual) {
            if (data.turno.activo) {
              agregarNotificacion({
                tipo: 'success',
                titulo: '🍽️ Nuevo Turno Iniciado',
                mensaje: `Ha comenzado el turno de ${data.turno.nombre}`,
                duracion: 10000,
                sonido: true
              })
            }
          }

          // Detectar proximidad de fin de turno
          if (data.turno.activo && data.horaActual) {
            const horaActual = data.horaActual.split(':').map(Number)
            const horaFin = data.turno.hora_fin ? data.turno.hora_fin.split(':').map(Number) : null
            
            if (horaFin) {
              const minutosActuales = horaActual[0] * 60 + horaActual[1]
              const minutosFin = horaFin[0] * 60 + horaFin[1]
              const diferencia = minutosFin - minutosActuales

              // Alertar 30 minutos antes del cierre
              if (diferencia === 30) {
                agregarNotificacion({
                  tipo: 'warning',
                  titulo: '⏰ Turno Finalizando',
                  mensaje: `El turno de ${data.turno.nombre} terminará en 30 minutos`,
                  duracion: 15000,
                  sonido: true
                })
              }

              // Alertar 10 minutos antes del cierre
              if (diferencia === 10) {
                agregarNotificacion({
                  tipo: 'warning',
                  titulo: '⚠️ Último Aviso',
                  mensaje: `El turno de ${data.turno.nombre} terminará en 10 minutos`,
                  duracion: 15000,
                  sonido: true
                })
              }

              // Turno finalizado
              if (diferencia <= 0 && turnoAnterior === turnoActual) {
                agregarNotificacion({
                  tipo: 'error',
                  titulo: '🚫 Turno Finalizado',
                  mensaje: `Ha terminado el turno de ${data.turno.nombre}`,
                  duracion: 8000,
                  sonido: true
                })
              }
            }
          }

          setTurnoAnterior(turnoActual)
        }
      } catch (error) {
        console.error('Error verificando turnos:', error)
      }
    }

    // Verificar inmediatamente y luego cada 30 segundos
    verificarCambiosTurno()
    intervalRef.current = setInterval(verificarCambiosTurno, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [habilitado, turnoAnterior])

  // Configurar contexto de audio
  useEffect(() => {
    if (sonidoActivo && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [sonidoActivo])

  const agregarNotificacion = (notificacion: Omit<Notificacion, 'id' | 'timestamp'>) => {
    const nuevaNotificacion: Notificacion = {
      ...notificacion,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }

    setNotificaciones(prev => [nuevaNotificacion, ...prev].slice(0, 5)) // Máximo 5 notificaciones

    // Reproducir sonido si está habilitado
    if (notificacion.sonido && sonidoActivo) {
      reproducirSonido(notificacion.tipo)
    }

    // Auto-eliminar después de la duración especificada
    if (notificacion.duracion) {
      setTimeout(() => {
        eliminarNotificacion(nuevaNotificacion.id)
      }, notificacion.duracion)
    }
  }

  const eliminarNotificacion = (id: string) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id))
  }

  const reproducirSonido = (tipo: 'info' | 'warning' | 'success' | 'error') => {
    if (!audioContextRef.current) return

    const context = audioContextRef.current
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    // Diferentes tonos para diferentes tipos
    switch (tipo) {
      case 'success':
        oscillator.frequency.setValueAtTime(800, context.currentTime)
        oscillator.frequency.setValueAtTime(1000, context.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3, context.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.3)
        break
      case 'warning':
        oscillator.frequency.setValueAtTime(600, context.currentTime)
        gainNode.gain.setValueAtTime(0.2, context.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.5)
        break
      case 'error':
        oscillator.frequency.setValueAtTime(400, context.currentTime)
        gainNode.gain.setValueAtTime(0.3, context.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.8)
        break
      default: // info
        oscillator.frequency.setValueAtTime(500, context.currentTime)
        gainNode.gain.setValueAtTime(0.2, context.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2)
        oscillator.start()
        oscillator.stop(context.currentTime + 0.2)
    }
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />
      default: return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  const getColorFondo = (tipo: string) => {
    switch (tipo) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'error': return 'bg-red-50 border-red-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  const getPosicionClases = () => {
    switch (posicion) {
      case 'top-left': return 'top-4 left-4'
      case 'bottom-right': return 'bottom-4 right-4'
      case 'bottom-left': return 'bottom-4 left-4'
      default: return 'top-4 right-4' // top-right
    }
  }

  if (!habilitado) return null

  return (
    <>
      {/* Control de sonido */}
      <div className="fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSonidoActivo(!sonidoActivo)}
          className="flex items-center space-x-2"
        >
          {sonidoActivo ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Contenedor de notificaciones */}
      <div className={`fixed ${getPosicionClases()} z-50 space-y-3 max-w-sm`}>
        <AnimatePresence>
          {notificaciones.map((notificacion) => (
            <motion.div
              key={notificacion.id}
              initial={{ opacity: 0, x: posicion.includes('right') ? 300 : -300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ 
                opacity: 0, 
                x: posicion.includes('right') ? 300 : -300, 
                scale: 0.8,
                transition: { duration: 0.2 }
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <Card className={`border-2 shadow-lg ${getColorFondo(notificacion.tipo)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getIconoTipo(notificacion.tipo)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {notificacion.titulo}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {notificacion.mensaje}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notificacion.timestamp.toLocaleTimeString('es-ES')}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarNotificacion(notificacion.id)}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  {notificacion.accion && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={notificacion.accion}
                        className="text-xs"
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

// Hook para usar notificaciones desde otros componentes
export const useNotificaciones = () => {
  const agregarNotificacion = (notificacion: Omit<Notificacion, 'id' | 'timestamp'>) => {
    // Esta función se puede expandir para trabajar con un contexto global
    console.log('Notificación:', notificacion)
  }

  return { agregarNotificacion }
}