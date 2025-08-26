'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Save, Plus, Trash2, Edit, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface Turno {
  id: string
  turno: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
  descripcion: string
}

interface ConfiguracionTurnosProps {
  onClose?: () => void
  onGuardado?: () => void
}

export default function ConfiguracionTurnos({ onClose, onGuardado }: ConfiguracionTurnosProps) {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [editando, setEditando] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error', texto: string} | null>(null)

  useEffect(() => {
    cargarTurnos()
  }, [])

  const cargarTurnos = async () => {
    try {
      const response = await fetch('/api/turnos/configuracion')
      const data = await response.json()
      
      if (data.success) {
        setTurnos(data.turnos)
      }
    } catch (error) {
      console.error('Error cargando turnos:', error)
      mostrarMensaje('error', 'Error cargando configuración de turnos')
    }
  }

  const validarTurno = (turno: Turno): string | null => {
    if (!turno.turno.trim()) {
      return 'El nombre del turno es requerido'
    }

    if (!turno.hora_inicio || !turno.hora_fin) {
      return 'Las horas de inicio y fin son requeridas'
    }

    const inicio = timeToMinutes(turno.hora_inicio)
    const fin = timeToMinutes(turno.hora_fin)

    if (inicio >= fin) {
      return 'La hora de fin debe ser posterior a la hora de inicio'
    }

    // Verificar solapamientos con otros turnos activos
    const otrosTurnos = turnos.filter(t => t.id !== turno.id && t.activo)
    for (const otroTurno of otrosTurnos) {
      const otroInicio = timeToMinutes(otroTurno.hora_inicio)
      const otroFin = timeToMinutes(otroTurno.hora_fin)

      if ((inicio < otroFin && fin > otroInicio)) {
        return `Se solapa con el turno de ${otroTurno.turno}`
      }
    }

    return null
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const guardarTurno = async (turno: Turno) => {
    const error = validarTurno(turno)
    if (error) {
      setErrors({...errors, [turno.id]: error})
      return
    }

    setGuardando(true)
    console.log('Guardando turno:', turno)
    
    try {
      const response = await fetch('/api/turnos/actualizar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(turno)
      })

      const data = await response.json()
      console.log('Respuesta de la API:', data)
      
      if (data.success) {
        // Recargar la lista de turnos después de guardar
        await cargarTurnos()
        setEditando(null)
        setErrors({...errors, [turno.id]: ''})
        mostrarMensaje('success', 'Turno guardado correctamente')
        onGuardado?.()
      } else {
        console.error('Error en API:', data.error)
        mostrarMensaje('error', data.error || 'Error guardando turno')
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      mostrarMensaje('error', 'Error conectando con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarTurno = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este turno?')) return

    try {
      const response = await fetch('/api/turnos/eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      const data = await response.json()
      
      if (data.success) {
        setTurnos(prev => prev.filter(t => t.id !== id))
        mostrarMensaje('success', 'Turno eliminado correctamente')
      } else {
        mostrarMensaje('error', data.error || 'Error eliminando turno')
      }
    } catch (error) {
      mostrarMensaje('error', 'Error conectando con el servidor')
    }
  }

  const agregarTurno = () => {
    const nuevoTurno: Turno = {
      id: `temp_${Date.now()}`,
      turno: 'Nuevo Turno',
      hora_inicio: '08:00',
      hora_fin: '12:00',
      activo: true,
      descripcion: ''
    }

    setTurnos(prev => [...prev, nuevoTurno])
    setEditando(nuevoTurno.id)
    // Limpiar errores previos
    setErrors({})
  }

  const actualizarTurno = (id: string, campo: keyof Turno, valor: any) => {
    setTurnos(prev => prev.map(turno => 
      turno.id === id ? { ...turno, [campo]: valor } : turno
    ))
  }

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 5000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Turnos</h2>
          <p className="text-gray-600">Gestione los horarios de funcionamiento del comedor</p>
        </div>
        <Button onClick={agregarTurno} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Turno</span>
        </Button>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {mensaje.tipo === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{mensaje.texto}</span>
          </div>
        </motion.div>
      )}

      {/* Lista de turnos */}
      <div className="space-y-4">
        {turnos.map((turno, index) => (
          <motion.div
            key={turno.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${
              editando === turno.id ? 'border-blue-300 shadow-blue-100 shadow-lg' : 'border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    {editando === turno.id ? (
                      <Input
                        value={turno.turno}
                        onChange={(e) => actualizarTurno(turno.id, 'turno', e.target.value)}
                        placeholder="Nombre del turno"
                        className="text-lg font-semibold"
                      />
                    ) : (
                      <span>{turno.turno}</span>
                    )}
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={turno.activo}
                      onCheckedChange={(checked) => actualizarTurno(turno.id, 'activo', checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditando(editando === turno.id ? null : turno.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => eliminarTurno(turno.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {editando === turno.id ? (
                  <div className="space-y-4">
                    {/* Horarios */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`inicio-${turno.id}`}>Hora Inicio</Label>
                        <Input
                          id={`inicio-${turno.id}`}
                          type="time"
                          value={turno.hora_inicio}
                          onChange={(e) => actualizarTurno(turno.id, 'hora_inicio', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`fin-${turno.id}`}>Hora Fin</Label>
                        <Input
                          id={`fin-${turno.id}`}
                          type="time"
                          value={turno.hora_fin}
                          onChange={(e) => actualizarTurno(turno.id, 'hora_fin', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <Label htmlFor={`desc-${turno.id}`}>Descripción</Label>
                      <Input
                        id={`desc-${turno.id}`}
                        value={turno.descripcion}
                        onChange={(e) => actualizarTurno(turno.id, 'descripcion', e.target.value)}
                        placeholder="Descripción del turno"
                      />
                    </div>

                    {/* Error */}
                    {errors[turno.id] && (
                      <div className="text-red-600 text-sm flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors[turno.id]}</span>
                      </div>
                    )}

                    {/* Botones */}
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setEditando(null)}
                        disabled={guardando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => guardarTurno(turno)}
                        disabled={guardando}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="font-medium">Horario:</span>
                      <span>{turno.hora_inicio} - {turno.hora_fin}</span>
                    </div>
                    {turno.descripcion && (
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-medium">Descripción:</span>
                        <span className="text-gray-600">{turno.descripcion}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="font-medium">Estado:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        turno.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {turno.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Notas importantes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Consideraciones importantes:</p>
              <ul className="space-y-1 text-xs">
                <li>• Los turnos no pueden solaparse en horarios</li>
                <li>• Los cambios se aplican inmediatamente en el sistema</li>
                <li>• Desactivar un turno impedirá nuevos registros en ese horario</li>
                <li>• Se recomienda configurar al menos 15 minutos de separación entre turnos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      {onClose && (
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      )}
    </div>
  )
}