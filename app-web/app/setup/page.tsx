'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellidos: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setMessage(`✅ Usuario creado exitosamente! 
        Email: ${data.credentials.email}
        Password: ${data.credentials.password}`)
      } else {
        setSuccess(false)
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setSuccess(false)
      setMessage('❌ Error conectando con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Configuración Inicial
            </CardTitle>
            <p className="text-gray-600">Crear usuario administrador</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Tu nombre"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                      placeholder="Tus apellidos"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? 'Creando usuario...' : 'Crear Usuario Administrador'}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold text-green-800">
                  ¡Usuario creado exitosamente!
                </h3>
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className="w-full"
                  >
                    Ir al Login
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="w-full"
                  >
                    Ir al Inicio
                  </Button>
                </div>
              </div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg p-3 flex items-start space-x-2 ${
                  success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {success ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <pre className={`text-xs whitespace-pre-wrap ${
                  success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {message}
                </pre>
              </motion.div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  ℹ️ Información:
                </h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• Usa tu email personal (será confirmado automáticamente)</p>
                  <p>• La contraseña debe tener al menos 6 caracteres</p>
                  <p>• Tendrás permisos de administrador completos</p>
                  <p>• No necesitas verificar tu email</p>
                  <p>• Si ya existe un usuario con ese email, será actualizado</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3 mt-3">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">
                  🔧 ¿Problemas con email existente?
                </h4>
                <div className="text-xs text-yellow-700">
                  <p>Si tienes problemas, elimina tu usuario primero:</p>
                  <code className="text-xs">POST /api/auth/delete-user</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          Sistema de Gestión de Comedor - Configuración v1.0
        </div>
      </motion.div>
    </div>
  )
}