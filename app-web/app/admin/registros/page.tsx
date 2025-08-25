'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RegistrosPage() {
  const router = useRouter()

  useEffect(() => {
    // Redireccionar a la página principal que maneja registros
    router.replace('/')
  }, [router])

  return null
}