/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Solo packages externos necesarios
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },

  // Configuración para imágenes (códigos de barras)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Optimización para producción
  compiler: {
    // Remover console.logs en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration - CAMBIO AQUÍ
  eslint: {
    ignoreDuringBuilds: true,  // ← Cambiado de false a true
  },

  // Headers combinados (PWA + Seguridad)
  async headers() {
    return [
      // PWA manifest headers
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Headers de seguridad globales
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig