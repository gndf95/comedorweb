'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GestionTurnos from '@/components/turnos/GestionTurnos'
import ConfiguracionTurnos from '@/components/turnos/ConfiguracionTurnos'
import ManejoExcepciones from '@/components/turnos/ManejoExcepciones'
import NotificacionesTurnos from '@/components/notificaciones/NotificacionesTurnos'
import { Clock, Settings, Shield, Bell } from 'lucide-react'

export default function TurnosAdminPage() {
  const [activeTab, setActiveTab] = useState('gestion')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notificaciones en tiempo real */}
      <NotificacionesTurnos 
        habilitado={true}
        sonidoHabilitado={true}
        posicion="top-right"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administración de Turnos
          </h1>
          <p className="text-gray-600">
            Gestione horarios, configuraciones y excepciones del sistema de comedor
          </p>
        </div>

        {/* Tabs de navegación */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gestion" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </TabsTrigger>
            <TabsTrigger value="excepciones" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Excepciones</span>
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notificaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gestion" className="space-y-6">
            <GestionTurnos />
          </TabsContent>

          <TabsContent value="configuracion" className="space-y-6">
            <ConfiguracionTurnos />
          </TabsContent>

          <TabsContent value="excepciones" className="space-y-6">
            <ManejoExcepciones />
          </TabsContent>

          <TabsContent value="notificaciones" className="space-y-6">
            <div className="grid gap-6">
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-4">Configuración de Notificaciones</h3>
                <p className="text-gray-600 mb-4">
                  Las notificaciones en tiempo real están habilitadas en esta página. 
                  Se mostrarán alertas para:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>Inicio y fin de turnos</li>
                  <li>Cambios en la configuración</li>
                  <li>Alertas 30 y 10 minutos antes del cierre</li>
                  <li>Excepciones de acceso</li>
                  <li>Problemas del sistema</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Vista en tiempo real</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Las notificaciones aparecerán automáticamente en la esquina superior derecha
                      cuando ocurran eventos importantes en el sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}