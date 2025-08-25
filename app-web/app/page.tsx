'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🍽️</div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Sistema de Comedor
        </h1>
        
        <p className="text-gray-400 mb-8">
          Selecciona el módulo que deseas usar
        </p>
        
        <div className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/kiosco">
              🖥️ Kiosco Principal
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href={user ? "/admin" : "/login"}>
              ⚙️ Panel Administrativo
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href={user ? "/admin/reportes" : "/login"}>
              📊 Sistema de Reportes
            </Link>
          </Button>

          {user && (
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-green-400 mb-2">
                👋 Bienvenido: {user.email}
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                onClick={() => signOut()}
              >
                🚪 Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-xs text-gray-500">
          <p>Sistema de Comedor Web v1.0</p>
          <p>Next.js + Supabase</p>
        </div>
      </div>
    </div>
  )
}