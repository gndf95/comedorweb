'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/usePWA'

export function PWAUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false)
  const { needsUpdate, updatePWA } = usePWA()

  const handleUpdate = () => {
    updatePWA()
    setDismissed(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {needsUpdate && !dismissed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg border border-green-500">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 flex-shrink-0" />
                <h3 className="font-semibold text-sm">Actualización disponible</h3>
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
            
            <p className="text-sm text-green-100 mb-4">
              Hay una nueva versión disponible con mejoras y correcciones.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-white text-green-600 hover:bg-green-50 flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar ahora
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                Más tarde
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PWAUpdatePrompt