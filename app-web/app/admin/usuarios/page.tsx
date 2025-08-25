'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UsuariosPage() {
  const router = useRouter()

  useEffect(() => {
    // Redireccionar a empleados que es la implementación real
    router.replace('/admin/empleados')
  }, [router])

  return null
}