'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Usuario {
  id: string
  codigo: string
  nombre: string
  tipo: 'EMPLEADO' | 'EXTERNO'
  departamento?: string
  foto_url?: string
}

interface TurnoActual {
  id: string | null
  turno?: string
  nombre: string
  activo: boolean
  hora_inicio?: string
  hora_fin?: string
}

type EstadoScaneo = 'idle' | 'processing' | 'success' | 'error' | 'already_scanned'

export default function ScannerUSB() {
  const soundEnabled = true
  const autoFocus = true
  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState<EstadoScaneo>('idle')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [turnoActual, setTurnoActual] = useState<TurnoActual | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [ultimoEscaneo, setUltimoEscaneo] = useState<Date | null>(null)
  const [logs, setLogs] = useState<Array<{id: string, timestamp: Date, codigo: string, resultado: string}>>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const audioContextRef = useRef<AudioContext>()

  // Mantener focus en el input para captura automática del scanner USB
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Re-enfocar cuando se pierda el focus
  useEffect(() => {
    const handleWindowClick = () => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus()
      }
    }
    
    window.addEventListener('click', handleWindowClick)
    return () => window.removeEventListener('click', handleWindowClick)
  }, [autoFocus])

  // Obtener turno actual al cargar
  useEffect(() => {
    obtenerTurnoActual()
  }, [])

  // Crear contexto de audio para sonidos
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [soundEnabled])

  const obtenerTurnoActual = async () => {
    try {
      const response = await fetch('/api/turnos/actual')
      if (response.ok) {
        const data = await response.json()
        console.log('Datos del turno actual recibidos:', data)
        setTurnoActual(data.turno || null)
      }
    } catch (error) {
      console.error('Error obteniendo turno actual:', error)
    }
  }

  const reproducirSonido = useCallback((tipo: 'success' | 'error') => {
    if (!soundEnabled || !audioContextRef.current) return

    const context = audioContextRef.current
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    if (tipo === 'success') {
      // Beep de éxito: 800Hz por 200ms
      oscillator.frequency.setValueAtTime(800, context.currentTime)
      gainNode.gain.setValueAtTime(0.3, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.2)
    } else {
      // Beep de error: 400Hz por 500ms
      oscillator.frequency.setValueAtTime(400, context.currentTime)
      gainNode.gain.setValueAtTime(0.3, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.5)
    }
  }, [soundEnabled])

  const agregarLog = (codigo: string, resultado: string) => {
    const nuevoLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      codigo,
      resultado
    }
    setLogs(prev => [nuevoLog, ...prev].slice(0, 10)) // Mantener solo los últimos 10
  }

  const procesarCodigo = async (codigoEscaneado: string) => {
    if (!codigoEscaneado.trim() || estado === 'processing') return

    setEstado('processing')
    setMensaje('Procesando...')

    try {
      // Buscar usuario por código
      const responseUsuario = await fetch(`/api/usuarios/buscar?codigo=${encodeURIComponent(codigoEscaneado)}`)
      
      if (!responseUsuario.ok) {
        throw new Error('Usuario no encontrado')
      }

      const usuarioData = await responseUsuario.json()
      
      if (!usuarioData.success || !usuarioData.usuario) {
        setEstado('error')
        setMensaje('Usuario no encontrado')
        setUsuario(null)
        reproducirSonido('error')
        agregarLog(codigoEscaneado, 'Usuario no encontrado')
        console.log('Escaneo fallido:', { codigo: codigoEscaneado, error: 'Usuario no encontrado' })
        return
      }

      const usuarioEncontrado = usuarioData.usuario
      setUsuario(usuarioEncontrado)

      // Verificar si ya escaneó en el turno actual
      if (!turnoActual?.activo) {
        setEstado('error')
        setMensaje('No hay turno activo en este momento')
        reproducirSonido('error')
        agregarLog(codigoEscaneado, 'Sin turno activo')
        console.log('Escaneo fallido:', { codigo: codigoEscaneado, error: 'Sin turno activo' })
        return
      }

      const responseVerificar = await fetch('/api/registros/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: usuarioEncontrado.id,
          turno: turnoActual.turno || turnoActual.nombre
        })
      })

      const verificacionData = await responseVerificar.json()

      if (verificacionData.yaEscaneo) {
        setEstado('already_scanned')
        setMensaje('Ya registró entrada en este turno')
        reproducirSonido('error')
        agregarLog(codigoEscaneado, 'Ya escaneado en turno')
        console.log('Escaneo fallido:', { codigo: codigoEscaneado, error: 'Ya escaneado en turno' })
        return
      }

      // Registrar la entrada
      const responseRegistro = await fetch('/api/registros/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: usuarioEncontrado.id,
          codigo: usuarioEncontrado.codigo,
          nombre: usuarioEncontrado.nombre,
          tipo: usuarioEncontrado.tipo,
          turno: turnoActual.turno || turnoActual.nombre,
          dispositivo: 'KIOSCO_WEB',
          metodoEntrada: 'SCANNER_USB'
        })
      })

      if (!responseRegistro.ok) {
        throw new Error('Error registrando entrada')
      }

      // Éxito
      setEstado('success')
      setMensaje('Entrada registrada exitosamente')
      setUltimoEscaneo(new Date())
      reproducirSonido('success')
      agregarLog(codigoEscaneado, 'Entrada registrada')
      console.log('Escaneo exitoso:', { codigo: codigoEscaneado, usuario: usuarioEncontrado })

    } catch (error) {
      console.error('Error procesando código:', error)
      setEstado('error')
      setMensaje(error instanceof Error ? error.message : 'Error desconocido')
      reproducirSonido('error')
      agregarLog(codigoEscaneado, 'Error de procesamiento')
      console.log('Escaneo fallido:', { codigo: codigoEscaneado, error })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setCodigo(valor)

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Detectar Enter automático del scanner (típicamente después de un delay muy corto)
    timeoutRef.current = setTimeout(() => {
      if (valor.trim()) {
        procesarCodigo(valor.trim())
      }
    }, 100) // 100ms delay para detectar entrada completa del scanner
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (codigo.trim()) {
        procesarCodigo(codigo.trim())
      }
    }
  }

  // Auto-clear después del procesamiento
  useEffect(() => {
    if (estado === 'success' || estado === 'error' || estado === 'already_scanned') {
      const clearTimer = setTimeout(() => {
        setCodigo('')
        setEstado('idle')
        setMensaje('')
        if (autoFocus && inputRef.current) {
          inputRef.current.focus()
        }
      }, 3000)

      return () => clearTimeout(clearTimer)
    }
  }, [estado, autoFocus])

  const getEstadoColor = () => {
    switch (estado) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'already_scanned': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-white border-gray-200'
    }
  }

  const getEstadoIcon = () => {
    switch (estado) {
      case 'success': return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'error': 
      case 'already_scanned': return <XCircle className="w-6 h-6 text-red-600" />
      case 'processing': return <Clock className="w-6 h-6 text-blue-600 animate-spin" />
      default: return <User className="w-6 h-6 text-gray-400" />
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Campo de entrada invisible para el scanner USB */}
      <input
        ref={inputRef}
        type="text"
        value={codigo}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        className="fixed -left-full opacity-0 pointer-events-none"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Información del turno actual */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">
                  {turnoActual?.activo ? turnoActual.nombre : 'Sin turno activo'}
                </h2>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleString('es-ES')}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              turnoActual?.activo 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {turnoActual?.activo ? 'ACTIVO' : 'INACTIVO'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de escaneo principal */}
      <Card className={`border-4 transition-all duration-300 ${getEstadoColor()}`}>
        <CardContent className="p-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={estado}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {getEstadoIcon()}
              
              <h3 className="text-2xl font-bold">
                {estado === 'idle' ? 'Escanee su código' : 
                 estado === 'processing' ? 'Procesando...' : 
                 mensaje}
              </h3>

              {usuario && (
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <h4 className="text-lg font-semibold">{usuario.nombre}</h4>
                  <p className="text-sm text-gray-600">
                    {usuario.codigo} • {usuario.tipo} • {usuario.departamento}
                  </p>
                </div>
              )}

              {ultimoEscaneo && estado === 'success' && (
                <p className="text-sm text-gray-600">
                  Registrado: {ultimoEscaneo.toLocaleTimeString('es-ES')}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Log de escaneos recientes */}
      {logs.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold mb-4">Actividad Reciente</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="flex justify-between items-center text-sm">
                  <span className="font-mono">{log.codigo}</span>
                  <span className="text-gray-600">{log.resultado}</span>
                  <span className="text-xs text-gray-400">
                    {log.timestamp.toLocaleTimeString('es-ES')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicador de foco para debugging */}
      <div className="text-center text-xs text-gray-400">
        Scanner USB listo • Foco automático {autoFocus ? 'ON' : 'OFF'} • Sonidos {soundEnabled ? 'ON' : 'OFF'}
        {codigo && <span> • Código capturado: {codigo}</span>}
      </div>
    </div>
  )
}