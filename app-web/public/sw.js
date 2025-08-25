// Service Worker para Sistema de Gestión de Comedor
// Versión del cache - incrementar para forzar actualización
const CACHE_VERSION = 'v1.0.0'
const STATIC_CACHE = `comedor-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `comedor-dynamic-${CACHE_VERSION}`
const API_CACHE = `comedor-api-${CACHE_VERSION}`

// Recursos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/admin',
  '/admin/dashboard',
  '/admin/empleados',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

// APIs que se pueden cachear temporalmente
const CACHEABLE_APIS = [
  '/api/empleados/estadisticas',
  '/api/dashboard/metricas',
  '/api/empleados',
  '/api/turnos/actual'
]

// APIs que se actualizan en tiempo real (no cachear)
const REALTIME_APIS = [
  '/api/dashboard/tiempo-real',
  '/api/estadisticas/accesos-diarios'
]

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('SW: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('SW: Precaching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('SW: Installation complete')
        return self.skipWaiting()
      })
      .catch(err => {
        console.error('SW: Installation failed', err)
      })
  )
})

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('SW: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Eliminar caches antiguos
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('SW: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('SW: Activation complete')
        return self.clients.claim()
      })
  )
})

// Interceptar requests
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) {
    return
  }

  // Estrategia según el tipo de recurso
  if (request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request))
  } else {
    event.respondWith(handleAssetRequest(request))
  }
})

// Manejar requests de APIs
async function handleApiRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // APIs en tiempo real - siempre de la red
  if (REALTIME_APIS.some(api => pathname.includes(api))) {
    try {
      const response = await fetch(request)
      return response
    } catch (error) {
      console.log('SW: Realtime API failed, returning error response')
      return new Response(
        JSON.stringify({ 
          error: 'Sin conexión', 
          offline: true,
          timestamp: new Date().toISOString()
        }), 
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
  
  // APIs cacheables - Network First con fallback a cache
  if (CACHEABLE_APIS.some(api => pathname.includes(api))) {
    try {
      const response = await fetch(request)
      
      if (response.ok) {
        const cache = await caches.open(API_CACHE)
        cache.put(request, response.clone())
      }
      
      return response
    } catch (error) {
      console.log('SW: API request failed, trying cache:', pathname)
      const cachedResponse = await caches.match(request)
      
      if (cachedResponse) {
        return cachedResponse
      }
      
      // Fallback para datos críticos
      return new Response(
        JSON.stringify({
          error: 'Sin conexión',
          offline: true,
          data: getOfflineFallback(pathname)
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
  
  // Otras APIs - Network Only
  return fetch(request)
}

// Manejar requests de documentos HTML
async function handleDocumentRequest(request) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('SW: Document request failed, trying cache')
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback a la página principal
    return caches.match('/')
  }
}

// Manejar requests de assets estáticos
async function handleAssetRequest(request) {
  // Cache First para assets estáticos
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('SW: Asset request failed:', request.url)
    
    // Para imágenes, devolver un placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">Sin conexión</text></svg>',
        {
          headers: { 'Content-Type': 'image/svg+xml' }
        }
      )
    }
    
    return new Response('Recurso no disponible sin conexión', { status: 503 })
  }
}

// Datos de fallback para modo offline
function getOfflineFallback(pathname) {
  const fallbacks = {
    '/api/empleados/estadisticas': {
      total: 0,
      activos: 0,
      inactivos: 0,
      empleados: 0,
      externos: 0,
      accesos_hoy: 0
    },
    '/api/dashboard/metricas': {
      accesos_hoy: 0,
      empleados_activos: 0,
      turnos_activos: 0,
      promedio_accesos_semana: 0
    },
    '/api/empleados': [],
    '/api/turnos/actual': {
      id: null,
      nombre: 'Sin conexión',
      activo: false,
      progreso: 0
    }
  }
  
  for (const [key, value] of Object.entries(fallbacks)) {
    if (pathname.includes(key)) {
      return value
    }
  }
  
  return null
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CLEAR_CACHE':
      clearAllCaches()
      break
      
    case 'CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS_RESPONSE', data: stats })
      })
      break
      
    case 'PREFETCH_ROUTES':
      prefetchRoutes(data.routes)
      break
  }
})

// Limpiar todos los caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
  console.log('SW: All caches cleared')
}

// Obtener estadísticas de cache
async function getCacheStats() {
  const cacheNames = await caches.keys()
  const stats = {}
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    stats[cacheName] = keys.length
  }
  
  return stats
}

// Precargar rutas importantes
async function prefetchRoutes(routes) {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  for (const route of routes) {
    try {
      const response = await fetch(route)
      if (response.ok) {
        await cache.put(route, response)
        console.log('SW: Prefetched:', route)
      }
    } catch (error) {
      console.log('SW: Failed to prefetch:', route, error)
    }
  }
}

// Sincronización en background (cuando vuelve la conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('SW: Background sync triggered')
  
  // Aquí puedes sincronizar datos pendientes
  // Por ejemplo, enviar registros de acceso almacenados localmente
  try {
    // Limpiar cache de APIs para obtener datos frescos
    const apiCache = await caches.open(API_CACHE)
    const apiKeys = await apiCache.keys()
    
    await Promise.all(
      apiKeys.map(key => apiCache.delete(key))
    )
    
    console.log('SW: API cache cleared for fresh data')
  } catch (error) {
    console.error('SW: Background sync failed:', error)
  }
}

// Notificar al cliente sobre actualizaciones
self.addEventListener('updatefound', () => {
  console.log('SW: Update found')
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        message: 'Nueva versión disponible. Recarga para actualizar.'
      })
    })
  })
})

console.log('SW: Service Worker loaded successfully')