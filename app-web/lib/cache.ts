// Sistema de caché en memoria para optimizar consultas frecuentes
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

interface CacheOptions {
  ttl?: number // Time to live en milisegundos
  maxSize?: number // Máximo número de entradas
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutos por defecto
  private maxSize = 1000

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL
    this.maxSize = options.maxSize || this.maxSize
  }

  set<T>(key: string, value: T, ttl?: number): void {
    // Limpiar entradas expiradas antes de agregar nueva
    this.cleanup()

    // Si se alcanza el límite, eliminar la entrada más antigua
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      expiresIn: ttl || this.defaultTTL
    }

    this.cache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Verificar si la entrada ha expirado
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Verificar si la entrada ha expirado
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Limpiar entradas expiradas
  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key)
      }
    }
  }

  // Obtener estadísticas del caché
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }

  // Invalidar por patrón
  invalidatePattern(pattern: string): number {
    let deleted = 0
    const regex = new RegExp(pattern)
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deleted++
      }
    }
    
    return deleted
  }
}

// Instancias globales de caché
export const apiCache = new MemoryCache({ 
  ttl: 2 * 60 * 1000, // 2 minutos para APIs
  maxSize: 500 
})

export const dataCache = new MemoryCache({ 
  ttl: 10 * 60 * 1000, // 10 minutos para datos
  maxSize: 200 
})

export const statisticsCache = new MemoryCache({ 
  ttl: 5 * 60 * 1000, // 5 minutos para estadísticas
  maxSize: 100 
})

// Caché de memoria general (alias para apiCache)
export const memoryCache = apiCache

// Funciones auxiliares para caché
export function getCacheKey(...parts: (string | number)[]): string {
  return parts.join(':')
}

export function withCache<T>(
  cacheInstance: MemoryCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Intentar obtener del caché primero
      const cached = cacheInstance.get<T>(key)
      if (cached !== null) {
        resolve(cached)
        return
      }

      // Si no está en caché, ejecutar la función
      const result = await fetcher()
      
      // Guardar en caché
      cacheInstance.set(key, result, ttl)
      
      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}

// Hook para React
import { useState, useEffect } from 'react'

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await withCache(apiCache, key, fetcher, ttl)
        
        if (mounted) {
          setData(result)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [key, ...dependencies])

  return { data, loading, error, refetch: () => {
    apiCache.delete(key)
    setLoading(true)
  }}
}

export default MemoryCache