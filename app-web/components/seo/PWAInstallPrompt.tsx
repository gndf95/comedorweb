'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/usePWA'

export function PWAInstallPrompt() {
  const [dismissed, setDismissed] = useState(false)
  const { canInstall, installPWA, installing } = usePWA()

  const handleInstall = async () => {
    const success = await installPWA()
    if (success) {
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Recordar que el usuario rechazó la instalación
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // No mostrar si ya fue rechazado anteriormente
  if (localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null
  }

  return (
    <AnimatePresence>
      {canInstall && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 flex-shrink-0" />
                <h3 className="font-semibold text-sm">Instalar App</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-blue-100 mb-4">
              Instala nuestra app para acceso rápido y funcionalidad sin conexión.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                disabled={installing}
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50 flex-1"
              >
                {installing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Instalar
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                Ahora no
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PWAInstallPrompt