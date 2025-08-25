import { createClient } from '@supabase/supabase-js'

// Credenciales directas para evitar problemas de env
const SUPABASE_URL = 'https://unigberekthjkrgmjxjs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaWdiZXJla3RoamtyZ21qeGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDQxMTIsImV4cCI6MjA3MTcyMDExMn0.My2wStrK2Q_OfV2MyBNwvwiahiNd7go6rFL0_EJsfgM'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaWdiZXJla3RoamtyZ21qeGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0NDExMiwiZXhwIjoyMDcxNzIwMTEyfQ.mLDqZeWET2Lhc2udN4TEtVJfdlusnYA2ZdgjWKVhO-o'

// Cliente de Supabase para uso en cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Cliente de Supabase para uso en servidor (con service role)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Tipos de la base de datos (se generarán con el comando npm run db:generate)
 */
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          codigo: string
          nombre: string
          tipo: 'EMPLEADO' | 'EXTERNO'
          activo: boolean
          email?: string
          telefono?: string
          departamento?: string
          foto_url?: string
          notas?: string
          fecha_creacion: string
          fecha_actualizacion: string
          creado_por?: string
        }
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
      }
      registros_comedor: {
        Row: {
          id: string
          usuario_id: string
          fecha: string
          hora: string
          turno: string
          timestamp_completo: string
          codigo: string
          nombre: string
          tipo: 'EMPLEADO' | 'EXTERNO'
          ip_address?: string
          user_agent?: string
          dispositivo?: string
          metodo_entrada: string
          procesado_por?: string
          notas?: string
        }
        Insert: Omit<Database['public']['Tables']['registros_comedor']['Row'], 'id' | 'timestamp_completo'>
        Update: Partial<Database['public']['Tables']['registros_comedor']['Insert']>
      }
      turnos_config: {
        Row: {
          id: string
          turno: string
          hora_inicio: string
          hora_fin: string
          activo: boolean
          descripcion?: string
          fecha_creacion: string
          fecha_actualizacion: string
        }
        Insert: Omit<Database['public']['Tables']['turnos_config']['Row'], 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Database['public']['Tables']['turnos_config']['Insert']>
      }
      configuraciones: {
        Row: {
          id: string
          clave: string
          valor: string
          tipo: string
          categoria: string
          descripcion?: string
          editable: boolean
          fecha_creacion: string
          fecha_actualizacion: string
          actualizado_por?: string
        }
        Insert: Omit<Database['public']['Tables']['configuraciones']['Row'], 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Database['public']['Tables']['configuraciones']['Insert']>
      }
    }
    Views: {}
    Functions: {
      obtener_turno_actual: {
        Args: {}
        Returns: {
          turno: string
          nombre: string
          activo: boolean
        }[]
      }
      ya_escaneo_en_turno: {
        Args: {
          p_usuario_id: string
          p_turno: string
          p_fecha?: string
        }
        Returns: boolean
      }
    }
  }
}

// Helper functions para trabajar con la base de datos

/**
 * Buscar usuario por código
 */
export async function buscarUsuario(codigo: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('codigo', codigo)
    .eq('activo', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error buscando usuario: ${error.message}`)
  }

  return data
}

/**
 * Registrar entrada al comedor
 */
export async function registrarEntrada({
  usuarioId,
  codigo,
  nombre,
  tipo,
  turno,
  dispositivo = 'KIOSCO',
  metodoEntrada = 'CODIGO'
}: {
  usuarioId: string
  codigo: string
  nombre: string
  tipo: 'EMPLEADO' | 'EXTERNO'
  turno: string
  dispositivo?: string
  metodoEntrada?: string
}) {
  const ahora = new Date()
  const fecha = ahora.toISOString().split('T')[0]
  const hora = ahora.toTimeString().split(' ')[0]

  const { data, error } = await supabase
    .from('registros_comedor')
    .insert({
      usuario_id: usuarioId,
      fecha,
      hora,
      turno,
      codigo,
      nombre,
      tipo,
      dispositivo,
      metodo_entrada: metodoEntrada,
      timestamp_completo: ahora.toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error registrando entrada: ${error.message}`)
  }

  return data
}

/**
 * Verificar si ya escaneó en el turno actual
 */
export async function yaEscaneoEnTurno(usuarioId: string, turno: string, fecha?: string) {
  const fechaConsulta = fecha || new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .rpc('ya_escaneo_en_turno', {
      p_usuario_id: usuarioId,
      p_turno: turno,
      p_fecha: fechaConsulta
    })

  if (error) {
    throw new Error(`Error verificando entrada: ${error.message}`)
  }

  return data
}

/**
 * Obtener estadísticas del día
 */
export async function obtenerEstadisticasDia(fecha?: string) {
  const fechaConsulta = fecha || new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('registros_comedor')
    .select(`
      turno,
      tipo,
      count:id
    `)
    .eq('fecha', fechaConsulta)

  if (error) {
    throw new Error(`Error obteniendo estadísticas: ${error.message}`)
  }

  return data
}