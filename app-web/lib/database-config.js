/**
 * CONFIGURACIÓN DE BASE DE DATOS - SUPABASE
 * Sistema de Comedor - Cliente y configuraciones para Next.js
 */

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Variables de entorno de Supabase no configuradas correctamente')
}

/**
 * Cliente principal de Supabase para uso en cliente
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

/**
 * Cliente administrativo de Supabase (solo para servidor)
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * FUNCIONES DE BASE DE DATOS - Sistema de Comedor
 */

/**
 * Buscar usuario por código (migrada desde sistema_turnos.py)
 */
export async function buscarUsuarioPorCodigo(codigo) {
  try {
    const { data, error } = await supabase
      .rpc('buscar_usuario_por_codigo', { p_codigo: codigo })
      .single()

    if (error) {
      console.error('Error buscando usuario:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error en buscarUsuarioPorCodigo:', error)
    return null
  }
}

/**
 * Obtener turno actual (migrada desde sistema_turnos.py)
 */
export async function obtenerTurnoActual() {
  try {
    const { data, error } = await supabase
      .rpc('obtener_turno_actual')

    if (error) {
      console.error('Error obteniendo turno actual:', error)
      // Fallback a lógica local
      return obtenerTurnoActualLocal()
    }

    return data && data.length > 0 ? data[0] : obtenerTurnoActualLocal()
  } catch (error) {
    console.error('Error en obtenerTurnoActual:', error)
    return obtenerTurnoActualLocal()
  }
}

/**
 * Lógica local para obtener turno (fallback)
 */
function obtenerTurnoActualLocal() {
  const ahora = new Date()
  const hora = ahora.getHours()
  const minutos = ahora.getMinutes()
  const horaDecimal = hora + (minutos / 60)

  // DESAYUNO: 06:00 - 10:00
  if (horaDecimal >= 6 && horaDecimal <= 10) {
    return { turno: 'DESAYUNO', nombre: 'Desayuno', activo: true }
  }
  
  // COMIDA: 11:30 - 16:30
  if (horaDecimal >= 11.5 && horaDecimal <= 16.5) {
    return { turno: 'COMIDA', nombre: 'Comida', activo: true }
  }
  
  // CENA: 20:00 - 22:00
  if (horaDecimal >= 20 && horaDecimal <= 22) {
    return { turno: 'CENA', nombre: 'Cena', activo: true }
  }

  // Fuera de horario
  if (horaDecimal < 6) {
    return { turno: 'DESAYUNO', nombre: 'Próximo: Desayuno a las 06:00', activo: false }
  } else if (horaDecimal > 10 && horaDecimal < 11.5) {
    return { turno: 'COMIDA', nombre: 'Próximo: Comida a las 11:30', activo: false }
  } else if (horaDecimal > 16.5 && horaDecimal < 20) {
    return { turno: 'CENA', nombre: 'Próximo: Cena a las 20:00', activo: false }
  } else {
    return { turno: 'DESAYUNO', nombre: 'Próximo: Desayuno mañana a las 06:00', activo: false }
  }
}

/**
 * Verificar si ya escaneó en el turno (migrada desde sistema_turnos.py)
 */
export async function yaEscaneoEnTurno(usuarioId, turno, fecha = null) {
  try {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .rpc('ya_escaneo_en_turno', {
        p_usuario_id: usuarioId,
        p_turno: turno,
        p_fecha: fechaConsulta
      })

    if (error) {
      console.error('Error verificando entrada duplicada:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error en yaEscaneoEnTurno:', error)
    return false
  }
}

/**
 * Registrar entrada al comedor (migrada desde sistema_turnos.py)
 */
export async function registrarEntrada(codigo, turno, opciones = {}) {
  try {
    const {
      dispositivo = 'KIOSCO',
      metodoEntrada = 'CODIGO',
      ipAddress = null
    } = opciones

    const { data, error } = await supabase
      .rpc('registrar_entrada', {
        p_codigo: codigo,
        p_turno: turno,
        p_dispositivo: dispositivo,
        p_metodo_entrada: metodoEntrada,
        p_ip_address: ipAddress
      })

    if (error) {
      console.error('Error registrando entrada:', error)
      return {
        success: false,
        error: 'DATABASE_ERROR',
        mensaje: 'Error interno del sistema'
      }
    }

    return data
  } catch (error) {
    console.error('Error en registrarEntrada:', error)
    return {
      success: false,
      error: 'SYSTEM_ERROR',
      mensaje: 'Error del sistema'
    }
  }
}

/**
 * Obtener estadísticas del día
 */
export async function obtenerEstadisticasDia(fecha = null) {
  try {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('stats_diarias')
      .select('*')
      .eq('fecha', fechaConsulta)

    if (error) {
      console.error('Error obteniendo estadísticas:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error en obtenerEstadisticasDia:', error)
    return []
  }
}

/**
 * Obtener lista de empleados activos
 */
export async function obtenerEmpleadosActivos() {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, codigo, nombre, tipo, email, departamento')
      .eq('activo', true)
      .order('codigo')

    if (error) {
      console.error('Error obteniendo empleados:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error en obtenerEmpleadosActivos:', error)
    return []
  }
}

/**
 * Obtener registros recientes
 */
export async function obtenerRegistrosRecientes(limite = 50) {
  try {
    const { data, error } = await supabase
      .from('registros_comedor')
      .select(`
        id,
        fecha,
        hora,
        codigo,
        nombre,
        tipo,
        turno,
        timestamp_completo,
        dispositivo,
        metodo_entrada
      `)
      .order('timestamp_completo', { ascending: false })
      .limit(limite)

    if (error) {
      console.error('Error obteniendo registros:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error en obtenerRegistrosRecientes:', error)
    return []
  }
}

/**
 * Obtener configuraciones del sistema
 */
export async function obtenerConfiguraciones(categoria = null) {
  try {
    let query = supabase
      .from('configuraciones')
      .select('clave, valor, tipo, categoria, descripcion')

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo configuraciones:', error)
      return {}
    }

    // Convertir array a objeto clave-valor
    const config = {}
    data?.forEach(item => {
      let valor = item.valor
      
      // Convertir tipos
      if (item.tipo === 'INTEGER') {
        valor = parseInt(valor, 10)
      } else if (item.tipo === 'BOOLEAN') {
        valor = valor === 'true'
      } else if (item.tipo === 'JSON') {
        try {
          valor = JSON.parse(valor)
        } catch (e) {
          console.warn('Error parsing JSON config:', item.clave)
        }
      }
      
      config[item.clave] = valor
    })

    return config
  } catch (error) {
    console.error('Error en obtenerConfiguraciones:', error)
    return {}
  }
}

/**
 * Suscribirse a cambios en tiempo real
 */
export function suscribirseACambios(tabla, callback) {
  const subscription = supabase
    .channel(`cambios-${tabla}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tabla
      },
      callback
    )
    .subscribe()

  return subscription
}

/**
 * Verificar estado de conexión
 */
export async function verificarConexion() {
  try {
    const { data, error } = await supabase
      .from('configuraciones')
      .select('clave')
      .limit(1)

    return { conectado: !error, error: error?.message }
  } catch (error) {
    return { conectado: false, error: error.message }
  }
}

/**
 * Funciones de desarrollo y testing
 */
export const dev = {
  /**
   * Crear usuario de prueba
   */
  async crearUsuarioPrueba(codigo, nombre, tipo = 'EMPLEADO') {
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        codigo,
        nombre,
        tipo,
        activo: true,
        email: tipo === 'EMPLEADO' ? `${codigo}@prueba.com` : null,
        departamento: 'DESARROLLO'
      })
      .select()

    return { data, error }
  },

  /**
   * Limpiar datos de prueba
   */
  async limpiarDatosPrueba() {
    // Solo en desarrollo
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Solo disponible en desarrollo')
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('departamento', 'DESARROLLO')

    return { error }
  },

  /**
   * Obtener estadísticas de desarrollo
   */
  async stats() {
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('tipo')

    const { data: registros } = await supabase
      .from('registros_comedor')
      .select('id')

    return {
      usuarios: usuarios?.length || 0,
      empleados: usuarios?.filter(u => u.tipo === 'EMPLEADO').length || 0,
      externos: usuarios?.filter(u => u.tipo === 'EXTERNO').length || 0,
      registros: registros?.length || 0
    }
  }
}

export default {
  supabase,
  supabaseAdmin,
  buscarUsuarioPorCodigo,
  obtenerTurnoActual,
  yaEscaneoEnTurno,
  registrarEntrada,
  obtenerEstadisticasDia,
  obtenerEmpleadosActivos,
  obtenerRegistrosRecientes,
  obtenerConfiguraciones,
  suscribirseACambios,
  verificarConexion,
  dev
}