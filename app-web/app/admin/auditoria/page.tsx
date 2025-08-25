'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Search, Calendar, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth/AuthProvider'

export default function AuditoriaPage() {
  const { isAdmin } = useAuth()

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
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoría</h1>
                <p className="text-gray-600">Registro de actividades del sistema</p>
              </div>
            </div>
          </div>

          <Card className="border-2 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Filtros de Búsqueda</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Inicio</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Fin</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Usuario</label>
                  <Input placeholder="Buscar por usuario" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Registro de Actividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Auditoría</h3>
                <p className="text-gray-600 mb-4">
                  Los logs de auditoría estarán disponibles próximamente
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-semibold text-blue-800 mb-2">Funcionalidades incluidas:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Registro de accesos de usuarios</li>
                    <li>• Cambios en configuración</li>
                    <li>• Actividades administrativas</li>
                    <li>• Errores del sistema</li>
                    <li>• Exportación de logs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}