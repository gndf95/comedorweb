import { Metadata } from 'next'

export interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article'
  noIndex?: boolean
  noFollow?: boolean
}

const DEFAULT_METADATA = {
  siteName: 'Sistema de Gestión de Comedor',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://comedor-admin.app',
  description: 'Sistema administrativo para gestión de comedor empresarial con códigos de barras y monitoreo en tiempo real',
  image: '/og-image.png',
  keywords: [
    'gestión de comedor',
    'administración empresarial',
    'códigos de barras',
    'monitoreo tiempo real',
    'dashboard administrativo',
    'control de acceso',
    'empleados',
    'estadísticas',
    'reportes'
  ]
}

export function generateMetadata({
  title,
  description = DEFAULT_METADATA.description,
  keywords = DEFAULT_METADATA.keywords,
  image = DEFAULT_METADATA.image,
  url = DEFAULT_METADATA.baseUrl,
  type = 'website',
  noIndex = false,
  noFollow = false
}: SEOProps = {}): Metadata {
  const fullTitle = title 
    ? `${title} | ${DEFAULT_METADATA.siteName}`
    : DEFAULT_METADATA.siteName

  const imageUrl = image.startsWith('http') 
    ? image 
    : `${DEFAULT_METADATA.baseUrl}${image}`

  const canonicalUrl = url.startsWith('http') 
    ? url 
    : `${DEFAULT_METADATA.baseUrl}${url}`

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Sistema de Gestión de Comedor' }],
    creator: 'Sistema de Gestión de Comedor',
    publisher: 'Sistema de Gestión de Comedor',
    
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: DEFAULT_METADATA.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'es_MX',
      type,
    },

    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
    },

    alternates: {
      canonical: canonicalUrl,
    },

    category: 'business',
    
    other: {
      'application-name': DEFAULT_METADATA.siteName,
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': DEFAULT_METADATA.siteName,
      'format-detection': 'telephone=no',
    }
  }
}

// Metadata específica para páginas
export const PAGE_METADATA = {
  dashboard: {
    title: 'Dashboard',
    description: 'Dashboard administrativo con métricas y estadísticas del sistema de comedor en tiempo real',
    keywords: ['dashboard', 'métricas', 'estadísticas', 'tiempo real', 'monitoreo']
  },
  
  empleados: {
    title: 'Gestión de Empleados',
    description: 'Administración completa de empleados con códigos de barras, estadísticas y control de accesos',
    keywords: ['empleados', 'gestión', 'códigos de barras', 'administración', 'usuarios']
  },
  
  'dashboard/live': {
    title: 'Dashboard en Tiempo Real',
    description: 'Monitoreo activo del sistema de comedor con métricas en tiempo real y alertas automáticas',
    keywords: ['tiempo real', 'monitoreo', 'live dashboard', 'alertas', 'métricas activas']
  },
  
  login: {
    title: 'Iniciar Sesión',
    description: 'Acceso seguro al sistema de gestión de comedor empresarial',
    keywords: ['login', 'acceso', 'autenticación', 'seguridad']
  },
  
  setup: {
    title: 'Configuración Inicial',
    description: 'Configuración inicial del sistema de gestión de comedor - Crear usuario administrador',
    keywords: ['setup', 'configuración', 'instalación', 'administrador']
  }
} as const

// Función para obtener metadata de página
export function getPageMetadata(page: keyof typeof PAGE_METADATA, customProps: SEOProps = {}) {
  const pageData = PAGE_METADATA[page]
  
  return generateMetadata({
    ...pageData,
    ...customProps
  })
}

// Schema.org structured data
export function generateStructuredData(type: 'WebApplication' | 'Organization' | 'WebPage', data: any = {}) {
  const baseSchemas = {
    WebApplication: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: DEFAULT_METADATA.siteName,
      description: DEFAULT_METADATA.description,
      url: DEFAULT_METADATA.baseUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      featureList: [
        'Gestión de empleados',
        'Códigos de barras',
        'Monitoreo en tiempo real',
        'Dashboard administrativo',
        'Estadísticas y reportes',
        'Control de accesos'
      ],
      ...data
    },
    
    Organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: DEFAULT_METADATA.siteName,
      url: DEFAULT_METADATA.baseUrl,
      description: DEFAULT_METADATA.description,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Technical Support'
      },
      ...data
    },
    
    WebPage: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: data.title || DEFAULT_METADATA.siteName,
      description: data.description || DEFAULT_METADATA.description,
      url: data.url || DEFAULT_METADATA.baseUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: DEFAULT_METADATA.siteName,
        url: DEFAULT_METADATA.baseUrl
      },
      ...data
    }
  }

  return JSON.stringify(baseSchemas[type])
}

// Función para generar structured data script
export function getStructuredDataScript(type: 'WebApplication' | 'Organization' | 'WebPage', data?: any): string {
  return `<script type="application/ld+json">${generateStructuredData(type, data)}</script>`
}

// Utilidades para sitemap dinámico
export function generateSitemap() {
  const routes = [
    { url: '/', priority: 1.0, changeFreq: 'daily' },
    { url: '/admin', priority: 0.9, changeFreq: 'daily' },
    { url: '/admin/dashboard', priority: 0.9, changeFreq: 'daily' },
    { url: '/admin/dashboard/live', priority: 0.8, changeFreq: 'always' },
    { url: '/admin/empleados', priority: 0.8, changeFreq: 'daily' },
    { url: '/login', priority: 0.7, changeFreq: 'monthly' },
    { url: '/setup', priority: 0.5, changeFreq: 'yearly' }
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map(route => `
    <url>
      <loc>${DEFAULT_METADATA.baseUrl}${route.url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${route.changeFreq}</changefreq>
      <priority>${route.priority}</priority>
    </url>
  `).join('')}
</urlset>`

  return sitemap
}

// Robots.txt dinámico
export function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Disallow: /api/
Disallow: /_next/
Disallow: /setup

Sitemap: ${DEFAULT_METADATA.baseUrl}/sitemap.xml`
}

export default {
  generateMetadata,
  getPageMetadata,
  generateStructuredData,
  getStructuredDataScript,
  generateSitemap,
  generateRobotsTxt,
  PAGE_METADATA,
  DEFAULT_METADATA
}