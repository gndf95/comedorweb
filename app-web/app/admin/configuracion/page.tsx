'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/components/auth/AuthProvider'

export default function ConfiguracionPage() {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Acceso Denegado</h2>
            <p className="text-red-600">No tiene permisos para acceder a esta sección.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                <p className="text-gray-600">Configuración general del sistema</p>
              </div>
            </div>
            <Button disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border-2 p-1">
              <TabsTrigger value="general" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Settings className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="turnos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Turnos
              </TabsTrigger>
              <TabsTrigger value="scanner" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Scanner
              </TabsTrigger>
              <TabsTrigger value="avanzado" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Avanzado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Configuración General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nombre_sistema">Nombre del Sistema</Label>
                      <Input
                        id="nombre_sistema"
                        defaultValue="Sistema de Comedor"
                        placeholder="Nombre del sistema"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Nombre de la Empresa</Label>
                      <Input
                        id="empresa"
                        defaultValue=""
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Modo Kiosco</Label>
                        <p className="text-sm text-gray-600">Ejecutar en pantalla completa</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-refresh</Label>
                        <p className="text-sm text-gray-600">Actualizar datos automáticamente</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Modo Debug</Label>
                        <p className="text-sm text-gray-600">Mostrar información de depuración</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="turnos">
              <div className="text-center py-12">
                <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración de Turnos</h3>
                <p className="text-gray-600 mb-4">
                  Usa la sección de Administración de Turnos para configurar horarios
                </p>
                <Button variant="outline">
                  Ir a Turnos
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="scanner">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración de Scanner</h3>
                <p className="text-gray-600 mb-4">Funcionalidad en desarrollo</p>
              </div>
            </TabsContent>

            <TabsContent value="avanzado">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración Avanzada</h3>
                <p className="text-gray-600 mb-4">Funcionalidad en desarrollo</p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}