import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-4">🔍</div>
        
        <h1 className="text-6xl font-bold text-white mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-white mb-4">
          Página no encontrada
        </h2>
        
        <p className="text-gray-400 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">
              Volver al inicio
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/kiosco">
              Ir al kiosco
            </Link>
          </Button>
        </div>
        
        <div className="mt-8 text-xs text-gray-500">
          <p>Rutas disponibles:</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/kiosco" className="hover:text-blue-400">/kiosco</Link> - Aplicación principal</li>
            <li><Link href="/admin" className="hover:text-blue-400">/admin</Link> - Panel administrativo</li>
            <li><Link href="/reportes" className="hover:text-blue-400">/reportes</Link> - Sistema de reportes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}