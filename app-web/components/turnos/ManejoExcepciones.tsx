'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Shield, Clock, User, Calendar, Settings, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface ExcepcionTurno {
  id: string
  usuario_id?: string
  codigo_usuario?: string
  nombre_usuario?: string
  turno_original: string
  turno_permitido: string
  fecha_inicio: string
  fecha_fin: string
  motivo: string
  activo: boolean
  creado_por: string
  fecha_creacion: string
}

interface ConfiguracionExcepciones {
  permitir_acceso_fuera_turno: boolean
  registrar_excepciones: boolean
  requerir_autorizacion_admin: boolean
  dias_gracia_nuevos_empleados: number
  horario_gracia_minutos: number
}

export default function ManejoExcepciones() {
  const [excepciones, setExcepciones] = useState<ExcepcionTurno[]>([])
  const [configuracion, setConfiguracion] = useState<ConfiguracionExcepciones>({
    permitir_acceso_fuera_turno: false,
    registrar_excepciones: true,
    requerir_autorizacion_admin: true,
    dias_gracia_nuevos_empleados: 7,
    horario_gracia_minutos: 15
  })
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [nuevaExcepcion, setNuevaExcepcion] = useState<Partial<ExcepcionTurno>>({
    codigo_usuario: '',
    turno_original: '',
    turno_permitido: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    motivo: '',
    activo: true
  })
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [excepcionesRes, configRes] = await Promise.all([
        fetch('/api/turnos/excepciones'),
        fetch('/api/turnos/configuracion-excepciones')
      ])

      const excepcionesData = await excepcionesRes.json()
      const configData = await configRes.json()

      if (excepcionesData.success) {
        setExcepciones(excepcionesData.excepciones)
      }

      if (configData.success) {
        setConfiguracion(configData.configuracion)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const guardarConfiguracion = async () => {
    setGuardando(true)
    try {
      const response = await fetch('/api/turnos/configuracion-excepciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuracion)
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Configuración guardada')
      }
    } catch (error) {
      console.error('Error guardando configuración:', error)
    } finally {
      setGuardando(false)
    }
  }

  const agregarExcepcion = async () => {
    if (!nuevaExcepcion.codigo_usuario || !nuevaExcepcion.turno_original || !nuevaExcepcion.turno_permitido) {
      return
    }

    try {
      const response = await fetch('/api/turnos/excepciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaExcepcion)
      })

      const data = await response.json()
      
      if (data.success) {
        setExcepciones(prev => [data.excepcion, ...prev])
        setMostrandoFormulario(false)
        setNuevaExcepcion({
          codigo_usuario: '',
          turno_original: '',
          turno_permitido: '',
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin: '',
          motivo: '',
          activo: true
        })
      }
    } catch (error) {
      console.error('Error creando excepción:', error)
    }
  }

  const toggleExcepcion = async (id: string, activo: boolean) => {
    try {
      const response = await fetch('/api/turnos/excepciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, activo })
      })

      const data = await response.json()
      
      if (data.success) {
        setExcepciones(prev => prev.map(exc => 
          exc.id === id ? { ...exc, activo } : exc
        ))
      }
    } catch (error) {
      console.error('Error actualizando excepción:', error)
    }
  }

  const eliminarExcepcion = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta excepción?')) return

    try {
      const response = await fetch('/api/turnos/excepciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      const data = await response.json()
      
      if (data.success) {
        setExcepciones(prev => prev.filter(exc => exc.id !== id))
      }
    } catch (error) {
      console.error('Error eliminando excepción:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manejo de Excepciones</h2>
          <p className="text-gray-600">Configure casos especiales y excepciones de turnos</p>
        </div>
        <Button 
          onClick={() => setMostrandoFormulario(true)}
          className="flex items-center space-x-2"
        >
          <Shield className="w-4 h-4" />
          <span>Nueva Excepción</span>
        </Button>
      </div>

      {/* Configuración general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configuración General</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Permitir acceso fuera de turno</Label>
                  <p className="text-xs text-gray-500">Permite registros fuera del horario asignado</p>
                </div>
                <Switch
                  checked={configuracion.permitir_acceso_fuera_turno}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, permitir_acceso_fuera_turno: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Registrar excepciones</Label>
                  <p className="text-xs text-gray-500">Mantiene un log de todos los accesos excepcionales</p>
                </div>
                <Switch
                  checked={configuracion.registrar_excepciones}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, registrar_excepciones: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Requerir autorización admin</Label>
                  <p className="text-xs text-gray-500">Las excepciones deben ser aprobadas por un administrador</p>
                </div>
                <Switch
                  checked={configuracion.requerir_autorizacion_admin}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, requerir_autorizacion_admin: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="dias_gracia">Días de gracia (nuevos empleados)</Label>
                <Input
                  id="dias_gracia"
                  type="number"
                  min="0"
                  max="30"
                  value={configuracion.dias_gracia_nuevos_empleados}
                  onChange={(e) => 
                    setConfiguracion(prev => ({ 
                      ...prev, 
                      dias_gracia_nuevos_empleados: parseInt(e.target.value) || 0 
                    }))
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Días que nuevos empleados pueden acceder sin restricciones
                </p>
              </div>

              <div>
                <Label htmlFor="horario_gracia">Minutos de gracia</Label>
                <Input
                  id="horario_gracia"
                  type="number"
                  min="0"
                  max="60"
                  value={configuracion.horario_gracia_minutos}
                  onChange={(e) => 
                    setConfiguracion(prev => ({ 
                      ...prev, 
                      horario_gracia_minutos: parseInt(e.target.value) || 0 
                    }))
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minutos adicionales permitidos después del cierre de turno
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={guardarConfiguracion} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulario nueva excepción */}
      <AnimatePresence>
        {mostrandoFormulario && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-300">
              <CardHeader>
                <CardTitle>Nueva Excepción de Turno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo_usuario">Código de Usuario</Label>
                    <Input
                      id="codigo_usuario"
                      value={nuevaExcepcion.codigo_usuario}
                      onChange={(e) => setNuevaExcepcion(prev => ({ ...prev, codigo_usuario: e.target.value }))}
                      placeholder="Ej: 1001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="turno_original">Turno Original</Label>
                    <select
                      id="turno_original"
                      value={nuevaExcepcion.turno_original}
                      onChange={(e) => setNuevaExcepcion(prev => ({ ...prev, turno_original: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seleccionar turno</option>
                      <option value="DESAYUNO">Desayuno</option>
                      <option value="COMIDA">Comida</option>
                      <option value="CENA">Cena</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="turno_permitido">Turno Permitido</Label>
                    <select
                      id="turno_permitido"
                      value={nuevaExcepcion.turno_permitido}
                      onChange={(e) => setNuevaExcepcion(prev => ({ ...prev, turno_permitido: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seleccionar turno</option>
                      <option value="DESAYUNO">Desayuno</option>
                      <option value="COMIDA">Comida</option>
                      <option value="CENA">Cena</option>
                      <option value="TODOS">Todos los turnos</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                    <Input
                      id="fecha_inicio"
                      type="date"
                      value={nuevaExcepcion.fecha_inicio}
                      onChange={(e) => setNuevaExcepcion(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fecha_fin">Fecha Fin (opcional)</Label>
                    <Input
                      id="fecha_fin"
                      type="date"
                      value={nuevaExcepcion.fecha_fin}
                      onChange={(e) => setNuevaExcepcion(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="motivo">Motivo de la Excepción</Label>
                    <Input
                      id="motivo"
                      value={nuevaExcepcion.motivo}
                      onChange={(e) => setNuevaExcepcion(prev => ({ ...prev, motivo: e.target.value }))}
                      placeholder="Ej: Cambio temporal de horario laboral"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setMostrandoFormulario(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={agregarExcepcion}>
                    Crear Excepción
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de excepciones */}
      <Card>
        <CardHeader>
          <CardTitle>Excepciones Activas</CardTitle>
        </CardHeader>
        <CardContent>
          {excepciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay excepciones configuradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {excepciones.map((excepcion) => (
                <div
                  key={excepcion.id}
                  className={`p-4 border rounded-lg ${
                    excepcion.activo ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">
                            {excepcion.codigo_usuario} - {excepcion.nombre_usuario}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{excepcion.turno_original} → {excepcion.turno_permitido}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {excepcion.fecha_inicio}
                            {excepcion.fecha_fin && ` - ${excepcion.fecha_fin}`}
                          </span>
                        </div>
                      </div>
                      {excepcion.motivo && (
                        <p className="text-sm text-gray-600 mt-1">{excepcion.motivo}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={excepcion.activo}
                        onCheckedChange={(checked) => toggleExcepcion(excepcion.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarExcepcion(excepcion.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}