'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Calendar, BarChart3, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/auth/AuthProvider'

export default function ReportesPage() {
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
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
                <p className="text-gray-600">Generar y descargar reportes del sistema</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="accesos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border-2 p-1">
              <TabsTrigger value="accesos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Clock className="w-4 h-4 mr-2" />
                Accesos
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="turnos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Turnos
              </TabsTrigger>
              <TabsTrigger value="personalizados" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Personalizados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accesos">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>Reporte Diario</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Accesos registrados en el día de hoy</p>
                    <Button className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Excel
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>Reporte Semanal</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Accesos de los últimos 7 días</p>
                    <Button className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Excel
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>Reporte Mensual</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Accesos del mes actual</p>
                    <Button className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Excel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="usuarios">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportes de Usuarios</h3>
                <p className="text-gray-600 mb-4">Funcionalidad en desarrollo</p>
              </div>
            </TabsContent>

            <TabsContent value="turnos">
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportes de Turnos</h3>
                <p className="text-gray-600 mb-4">Funcionalidad en desarrollo</p>
              </div>
            </TabsContent>

            <TabsContent value="personalizados">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportes Personalizados</h3>
                <p className="text-gray-600 mb-4">Funcionalidad en desarrollo</p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}