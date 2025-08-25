'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error para debugging
    console.error('Error en la aplicación:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Algo salió mal
        </h1>
        
        <p className="text-gray-400 mb-6">
          Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
        </p>
        
        {error.message && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm font-mono">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full"
            variant="default"
          >
            Intentar de nuevo
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            Volver al inicio
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          Si el problema persiste, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  )
}