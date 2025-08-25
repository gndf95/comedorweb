'use client'

import { useEffect } from 'react'

export default function AppInitializerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Importación dinámica solo del lado del cliente
    import('@/lib/app-initializer').then(({ AppInitializer }) => {
      AppInitializer.initialize()
    }).catch(error => {
      console.error('Error al inicializar aplicación:', error)
    })
  }, [])

  return <>{children}</>
}