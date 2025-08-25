import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { appConfig } from '@/lib/env'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { generateMetadata as generateSEOMetadata, generateStructuredData } from '@/lib/seo'
import SEOProvider from '@/components/seo/SEOProvider'
import PWAInstallPrompt from '@/components/seo/PWAInstallPrompt'
import PWAUpdatePrompt from '@/components/seo/PWAUpdatePrompt'
import ErrorTrackerProvider from '@/components/providers/ErrorTrackerProvider'
import '@/lib/app-initializer' // Auto-inicializar optimizaciones

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generateSEOMetadata({
  type: 'website',
  noIndex: true, // Admin system should not be indexed
  noFollow: true
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateStructuredData('WebApplication', {})
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorTrackerProvider>
          <AuthProvider>
            <SEOProvider>
              {children}
              <PWAInstallPrompt />
              <PWAUpdatePrompt />
              <Toaster 
                position="top-center"
                expand={true}
                richColors
                closeButton
              />
            </SEOProvider>
          </AuthProvider>
        </ErrorTrackerProvider>
      </body>
    </html>
  )
}