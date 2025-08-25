'use client'

import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, LayoutDashboard, Users, Activity, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface AdminHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  showBackButton?: boolean
  customBackPath?: string
  actions?: React.ReactNode
}

export function AdminHeader({ 
  title, 
  subtitle, 
  icon, 
  showBackButton = true, 
  customBackPath,
  actions 
}: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = () => {
    if (customBackPath) {
      router.push(customBackPath)
    } else if (pathname.includes('/admin/dashboard/live')) {
      router.push('/admin/dashboard')
    } else {
      router.push('/admin')
    }
  }

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []

    if (segments.includes('admin')) {
      breadcrumbs.push({ label: 'Admin', path: '/admin', icon: <Home className="w-3 h-3" /> })
      
      if (segments.includes('dashboard')) {
        breadcrumbs.push({ 
          label: 'Dashboard', 
          path: '/admin/dashboard', 
          icon: <LayoutDashboard className="w-3 h-3" /> 
        })
        
        if (segments.includes('live')) {
          breadcrumbs.push({ 
            label: 'Tiempo Real', 
            path: '/admin/dashboard/live', 
            icon: <Activity className="w-3 h-3" /> 
          })
        }
      }
      
      if (segments.includes('empleados')) {
        breadcrumbs.push({ 
          label: 'Empleados', 
          path: '/admin/empleados', 
          icon: <Users className="w-3 h-3" /> 
        })
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-b-2 rounded-none border-l-0 border-r-0 border-t-0 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <nav className="mb-3">
              <ol className="flex items-center space-x-2 text-sm text-gray-600">
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.path} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                    <button
                      onClick={() => router.push(crumb.path)}
                      className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${
                        index === breadcrumbs.length - 1 
                          ? 'text-blue-600 font-medium' 
                          : 'text-gray-500'
                      }`}
                    >
                      {crumb.icon}
                      <span>{crumb.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Header principal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Button>
              )}
              
              <div className="flex items-center space-x-3">
                {icon && (
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {icon}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="text-gray-600 text-sm">{subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones adicionales */}
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default AdminHeader