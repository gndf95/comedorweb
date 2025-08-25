'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Download, Upload, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'

export default function CodigosPage() {
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
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Códigos de Barras</h1>
                <p className="text-gray-600">Generar y gestionar códigos de barras</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5" />
                  <span>Generar Códigos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Generar códigos de barras para empleados</p>
                <Button className="w-full" disabled>
                  <QrCode className="w-4 h-4 mr-2" />
                  Próximamente
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Printer className="w-5 h-5" />
                  <span>Imprimir Códigos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Imprimir códigos de barras en formato PDF</p>
                <Button className="w-full" disabled>
                  <Printer className="w-4 h-4 mr-2" />
                  Próximamente
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Exportar Códigos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Exportar códigos a diferentes formatos</p>
                <Button className="w-full" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 mt-8">
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">🚧 En Desarrollo</h4>
                <p className="text-yellow-700">
                  El sistema de generación de códigos de barras está en desarrollo. 
                  Las funcionalidades estarán disponibles en una próxima actualización.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}