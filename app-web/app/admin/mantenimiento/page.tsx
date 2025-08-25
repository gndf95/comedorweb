'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wrench, Database, RefreshCw, Trash2, Download, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'

export default function MantenimientoPage() {
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
                <Wrench className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
                <p className="text-gray-600">Herramientas de mantenimiento del sistema</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Base de Datos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600 text-sm">Operaciones de base de datos</p>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" disabled={loading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Optimizar DB
                  </Button>
                  <Button className="w-full" variant="outline" disabled={loading}>
                    <Download className="w-4 h-4 mr-2" />
                    Backup
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trash2 className="w-5 h-5" />
                  <span>Limpieza</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600 text-sm">Limpiar datos antiguos</p>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" disabled={loading}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar Logs
                  </Button>
                  <Button className="w-full" variant="outline" disabled={loading}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar Cache
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Importar/Exportar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600 text-sm">Migración de datos</p>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" disabled={loading}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Datos
                  </Button>
                  <Button className="w-full" variant="outline" disabled={loading}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Datos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 mt-8">
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">99%</div>
                  <div className="text-sm text-green-700">Disponibilidad</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">1.2GB</div>
                  <div className="text-sm text-blue-700">Uso de DB</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-orange-700">Errores</div>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Advertencia</h4>
                <p className="text-yellow-700 text-sm">
                  Las herramientas de mantenimiento están en desarrollo. 
                  Contacta al administrador del sistema para operaciones críticas.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}