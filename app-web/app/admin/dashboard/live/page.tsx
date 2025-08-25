'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { LiveDashboard } from '@/components/ui/live-dashboard'
import { useAuth } from '@/components/auth/AuthProvider'
import { AdminHeader } from '@/components/ui/admin-header'
import { Card, CardContent } from '@/components/ui/card'
import { XCircle } from 'lucide-react'

export default function DashboardLivePage() {
  const { user, isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Acceso Denegado</h2>
            <p className="text-red-600">No tiene permisos para acceder a esta sección.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <AdminHeader
        title="Dashboard en Tiempo Real"
        subtitle="Monitoreo activo del sistema de comedor"
        icon={<Activity className="w-6 h-6 text-green-600" />}
        customBackPath="/admin/dashboard"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Dashboard Component */}
          <LiveDashboard />

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                ℹ️ Información del Dashboard
              </h3>
              <div className="text-xs text-blue-700 space-y-1 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>• Los datos se actualizan automáticamente cada 30 segundos</p>
                    <p>• El sistema detecta automáticamente picos de actividad</p>
                    <p>• Las alertas se muestran cuando hay actividad inusual</p>
                  </div>
                  <div>
                    <p>• Los turnos se calculan automáticamente según la hora</p>
                    <p>• La tendencia compara la última hora vs anterior</p>
                    <p>• Los departamentos se ordenan por actividad</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}