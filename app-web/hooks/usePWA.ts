'use client'

import { useState, useEffect, useCallback } from 'react'

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOffline: boolean
  updateAvailable: boolean
  installing: boolean
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    updateAvailable: false,
    installing: false
  })

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker()
    }

    // Detectar si ya está instalado como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://')

    setState(prev => ({
      ...prev,
      isInstalled: isStandalone
    }))

    // Listeners para eventos PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setState(prev => ({ ...prev, isInstallable: true }))
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true
      }))
    }

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }))
    }

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }))
    }

    // Agregar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Estado inicial de conexión
    setState(prev => ({ ...prev, isOffline: !navigator.onLine }))

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      })

      setRegistration(reg)

      // Listener para actualizaciones
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          setState(prev => ({ ...prev, installing: true }))
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({
                ...prev,
                updateAvailable: true,
                installing: false
              }))
            }
          })
        }
      })

      // Listener para mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, message } = event.data
        
        if (type === 'UPDATE_AVAILABLE') {
          setState(prev => ({ ...prev, updateAvailable: true }))
        }
      })

      console.log('Service Worker registered successfully')
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  // Instalar PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return false

    try {
      setState(prev => ({ ...prev, installing: true }))
      
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      setState(prev => ({
        ...prev,
        installing: false,
        isInstallable: outcome === 'dismissed'
      }))

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        return true
      }

      return false
    } catch (error) {
      console.error('PWA installation failed:', error)
      setState(prev => ({ ...prev, installing: false }))
      return false
    }
  }, [deferredPrompt])

  // Actualizar PWA
  const updatePWA = useCallback(() => {
    if (!registration?.waiting) return

    // Enviar mensaje al service worker para que se active
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    
    // Recargar la página
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }, [registration])

  // Limpiar caché
  const clearCache = useCallback(async () => {
    if (!registration?.active) return

    registration.active.postMessage({ type: 'CLEAR_CACHE' })
    
    // También limpiar localStorage y sessionStorage
    localStorage.clear()
    sessionStorage.clear()
    
    console.log('Cache cleared')
  }, [registration])

  // Obtener estadísticas de caché
  const getCacheStats = useCallback(async (): Promise<Record<string, number>> => {
    if (!registration?.active) return {}

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_STATS_RESPONSE') {
          resolve(event.data.data)
        }
      })
      
      messageChannel.port1.start()
      
      registration.active.postMessage(
        { type: 'CACHE_STATS' },
        [messageChannel.port2]
      )
    })
  }, [registration])

  // Precargar rutas importantes
  const prefetchRoutes = useCallback((routes: string[]) => {
    if (!registration?.active) return

    registration.active.postMessage({
      type: 'PREFETCH_ROUTES',
      data: { routes }
    })
  }, [registration])

  return {
    ...state,
    installPWA,
    updatePWA,
    clearCache,
    getCacheStats,
    prefetchRoutes,
    canInstall: state.isInstallable && !state.isInstalled,
    needsUpdate: state.updateAvailable
  }
}

// Hook para notificaciones push
export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      setPermission(Notification.permission)
      
      // Obtener suscripción existente
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSubscription = await registration.pushManager.getSubscription()
        setSubscription(existingSubscription)
      })
    }
  }, [])

  const requestPermission = async () => {
    if (!supported) return false

    const permission = await Notification.requestPermission()
    setPermission(permission)
    
    return permission === 'granted'
  }

  const subscribe = async (vapidPublicKey: string) => {
    if (!supported || permission !== 'granted') return null

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })

      setSubscription(subscription)
      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  const unsubscribe = async () => {
    if (subscription) {
      await subscription.unsubscribe()
      setSubscription(null)
    }
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        ...options
      })
    }
  }

  return {
    supported,
    permission,
    subscription,
    isSubscribed: !!subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification
  }
}

export default usePWA