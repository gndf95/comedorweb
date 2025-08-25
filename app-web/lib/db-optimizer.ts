import { supabaseAdmin } from '@/lib/supabase'
import { apiCache, getCacheKey } from '@/lib/cache'

// Configuraciones de consultas optimizadas
export const QUERY_LIMITS = {
  SMALL: 10,
  MEDIUM: 50,
  LARGE: 100,
  MAX: 1000
} as const

export const CACHE_DURATIONS = {
  SHORT: 30 * 1000,      // 30 segundos
  MEDIUM: 2 * 60 * 1000, // 2 minutos
  LONG: 10 * 60 * 1000,  // 10 minutos
  VERY_LONG: 30 * 60 * 1000 // 30 minutos
} as const

// Optimizador de consultas base
class QueryOptimizer {
  private static instance: QueryOptimizer
  
  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer()
    }
    return QueryOptimizer.instance
  }

  // Consulta optimizada con caché
  async query<T>(
    table: string,
    select: string,
    filters: Record<string, any> = {},
    options: {
      limit?: number
      orderBy?: { column: string; ascending?: boolean }
      cache?: boolean
      cacheDuration?: number
      cacheKey?: string
    } = {}
  ): Promise<{ data: T[] | null; error: any; fromCache: boolean }> {
    const {
      limit = QUERY_LIMITS.MEDIUM,
      orderBy,
      cache = true,
      cacheDuration = CACHE_DURATIONS.MEDIUM,
      cacheKey
    } = options

    // Generar clave de caché
    const key = cacheKey || getCacheKey(
      'query',
      table,
      select,
      JSON.stringify(filters),
      JSON.stringify(orderBy),
      limit.toString()
    )

    // Intentar obtener del caché
    if (cache) {
      const cached = apiCache.get<{ data: T[]; error: any }>(key)
      if (cached) {
        return { ...cached, fromCache: true }
      }
    }

    // Construir consulta
    let query = supabaseAdmin.from(table).select(select)

    // Aplicar filtros
    Object.entries(filters).forEach(([column, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(column, value)
        } else if (typeof value === 'object' && value.operator) {
          // Filtros complejos: { operator: 'gte', value: '2023-01-01' }
          switch (value.operator) {
            case 'gte':
              query = query.gte(column, value.value)
              break
            case 'lte':
              query = query.lte(column, value.value)
              break
            case 'gt':
              query = query.gt(column, value.value)
              break
            case 'lt':
              query = query.lt(column, value.value)
              break
            case 'like':
              query = query.like(column, value.value)
              break
            case 'ilike':
              query = query.ilike(column, value.value)
              break
            case 'neq':
              query = query.neq(column, value.value)
              break
          }
        } else {
          query = query.eq(column, value)
        }
      }
    })

    // Aplicar ordenamiento
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    // Aplicar límite
    if (limit) {
      query = query.limit(limit)
    }

    try {
      const result = await query

      // Guardar en caché si está habilitado
      if (cache && !result.error) {
        apiCache.set(key, result, cacheDuration)
      }

      return { ...result, fromCache: false }
    } catch (error) {
      console.error('Error in optimized query:', error)
      return { data: null, error, fromCache: false }
    }
  }

  // Consultas específicas optimizadas
  async getEmpleados(filters: {
    activo?: boolean
    tipo?: string
    departamento?: string
    search?: string
  } = {}) {
    const queryFilters: Record<string, any> = {}
    
    if (filters.activo !== undefined) {
      queryFilters.activo = filters.activo
    }
    
    if (filters.tipo) {
      queryFilters.tipo = filters.tipo
    }
    
    if (filters.departamento) {
      queryFilters.departamento = filters.departamento
    }

    let select = `
      id,
      codigo,
      nombre,
      apellidos,
      email,
      telefono,
      departamento,
      activo,
      fecha_creacion,
      fecha_actualizacion,
      tipo
    `

    const result = await this.query<any>(
      'usuarios',
      select,
      queryFilters,
      {
        limit: QUERY_LIMITS.LARGE,
        orderBy: { column: 'fecha_creacion', ascending: false },
        cacheDuration: CACHE_DURATIONS.MEDIUM
      }
    )

    // Aplicar filtro de búsqueda en memoria (más eficiente para texto)
    if (filters.search && result.data) {
      const searchTerm = filters.search.toLowerCase()
      result.data = result.data.filter(emp => 
        emp.nombre?.toLowerCase().includes(searchTerm) ||
        emp.apellidos?.toLowerCase().includes(searchTerm) ||
        emp.codigo?.toLowerCase().includes(searchTerm) ||
        emp.email?.toLowerCase().includes(searchTerm)
      )
    }

    return result
  }

  async getAccesosDelDia(fecha: string) {
    return this.query<any>(
      'accesos',
      `
        id,
        fecha_acceso,
        usuario_id,
        usuarios!inner(
          id,
          codigo,
          nombre,
          apellidos,
          departamento,
          tipo
        )
      `,
      {
        fecha_acceso: {
          operator: 'gte',
          value: `${fecha}T00:00:00`
        }
      },
      {
        limit: QUERY_LIMITS.MAX,
        orderBy: { column: 'fecha_acceso', ascending: false },
        cacheDuration: CACHE_DURATIONS.SHORT,
        cacheKey: `accesos_dia_${fecha}`
      }
    )
  }

  async getEstadisticasEmpleados() {
    const cacheKey = 'estadisticas_empleados'
    
    // Intentar caché primero
    const cached = apiCache.get<any>(cacheKey)
    if (cached) {
      return { ...cached, fromCache: true }
    }

    try {
      const [usuariosResult, accesosHoyResult] = await Promise.all([
        supabaseAdmin
          .from('usuarios')
          .select('id, activo, tipo'),
        
        supabaseAdmin
          .from('accesos')
          .select('id')
          .gte('fecha_acceso', new Date().toISOString().split('T')[0])
      ])

      const estadisticas = {
        total: usuariosResult.data?.length || 0,
        activos: usuariosResult.data?.filter(u => u.activo).length || 0,
        inactivos: usuariosResult.data?.filter(u => !u.activo).length || 0,
        empleados: usuariosResult.data?.filter(u => u.tipo?.toLowerCase() === 'empleado').length || 0,
        externos: usuariosResult.data?.filter(u => u.tipo?.toLowerCase() !== 'empleado').length || 0,
        accesos_hoy: accesosHoyResult.data?.length || 0
      }

      const result = { data: estadisticas, error: null }
      
      // Guardar en caché
      apiCache.set(cacheKey, result, CACHE_DURATIONS.MEDIUM)
      
      return { ...result, fromCache: false }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return { data: null, error, fromCache: false }
    }
  }

  // Invalidar caché por patrón
  invalidateCache(pattern: string) {
    return apiCache.invalidatePattern(pattern)
  }

  // Invalidar caché específico
  clearCache(key: string) {
    return apiCache.delete(key)
  }

  // Obtener estadísticas de caché
  getCacheStats() {
    return apiCache.getStats()
  }
}

// Instancia singleton
export const dbOptimizer = QueryOptimizer.getInstance()

// Middleware para APIs con caché automático
export function withOptimizedQuery<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  cacheDuration: number = CACHE_DURATIONS.MEDIUM
) {
  return async (): Promise<T> => {
    // Verificar caché
    const cached = apiCache.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Ejecutar consulta
    const result = await fetcher()
    
    // Guardar en caché
    apiCache.set(cacheKey, result, cacheDuration)
    
    return result
  }
}

// Utilidades de rendimiento
export const performanceUtils = {
  // Agregar índices sugeridos (para documentación)
  suggestedIndexes: {
    usuarios: ['activo', 'tipo', 'departamento', 'fecha_creacion'],
    accesos: ['fecha_acceso', 'usuario_id'],
    turnos_config: ['activo', 'hora_inicio']
  },

  // Consultas preparadas más eficientes
  batchOperations: {
    async bulkInsert(table: string, records: any[], batchSize: number = 100) {
      const results = []
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        const result = await supabaseAdmin
          .from(table)
          .insert(batch)
        
        results.push(result)
      }
      
      return results
    },

    async bulkUpdate(table: string, updates: Array<{id: string, data: any}>, batchSize: number = 50) {
      const results = []
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        
        const promises = batch.map(update =>
          supabaseAdmin
            .from(table)
            .update(update.data)
            .eq('id', update.id)
        )
        
        const batchResults = await Promise.all(promises)
        results.push(...batchResults)
      }
      
      return results
    }
  }
}

export default QueryOptimizer