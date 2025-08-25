import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const ahora = new Date()
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    const hace30Min = new Date(ahora.getTime() - 30 * 60 * 1000)
    const hace1Hora = new Date(ahora.getTime() - 60 * 60 * 1000)

    // Obtener accesos de hoy
    const { data: accesosHoy, error: errorHoy } = await supabaseAdmin
      .from('accesos')
      .select(`
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
      `)
      .gte('fecha_acceso', hoyInicio.toISOString())
      .order('fecha_acceso', { ascending: false })

    if (errorHoy) {
      console.error('Error obteniendo accesos de hoy:', errorHoy)
    }

    // Obtener accesos recientes (últimos 30 minutos)
    const { data: accesosRecientes, error: errorRecientes } = await supabaseAdmin
      .from('accesos')
      .select(`
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
      `)
      .gte('fecha_acceso', hace30Min.toISOString())
      .order('fecha_acceso', { ascending: false })
      .limit(50)

    if (errorRecientes) {
      console.error('Error obteniendo accesos recientes:', errorRecientes)
    }

    // Obtener total de empleados activos
    const { data: empleadosActivos, error: errorEmpleados } = await supabaseAdmin
      .from('usuarios')
      .select('id, activo')
      .eq('activo', true)

    if (errorEmpleados) {
      console.error('Error obteniendo empleados activos:', errorEmpleados)
    }

    // Procesar datos para métricas
    const horaActual = ahora.getHours()
    const empleadosHoyUnicos = new Set(accesosHoy?.map(a => a.usuario_id) || [])
    const empleadosRecientesUnicos = new Set(accesosRecientes?.map(a => a.usuario_id) || [])

    // Determinar turno actual
    let turnoActual = 'Fuera de horario'
    if (horaActual >= 6 && horaActual < 9) turnoActual = 'Desayuno'
    else if (horaActual >= 11 && horaActual < 15) turnoActual = 'Almuerzo'
    else if (horaActual >= 17 && horaActual < 20) turnoActual = 'Cena'
    else if (horaActual >= 20 || horaActual < 6) turnoActual = 'Nocturno'

    // Calcular accesos por hora (últimas 24 horas)
    const accesosPorHora: Record<number, number> = {}
    for (let i = 0; i < 24; i++) {
      accesosPorHora[i] = 0
    }

    accesosHoy?.forEach(acceso => {
      const hora = new Date(acceso.fecha_acceso).getHours()
      accesosPorHora[hora] = (accesosPorHora[hora] || 0) + 1
    })

    // Calcular tendencia (comparar última hora vs hora anterior)
    const accesosUltimaHora = accesosHoy?.filter(acceso => 
      new Date(acceso.fecha_acceso) >= hace1Hora
    ).length || 0

    const hace2Horas = new Date(ahora.getTime() - 2 * 60 * 60 * 1000)
    const accesosHoraAnterior = accesosHoy?.filter(acceso => {
      const fechaAcceso = new Date(acceso.fecha_acceso)
      return fechaAcceso >= hace2Horas && fechaAcceso < hace1Hora
    }).length || 0

    const tendencia = accesosUltimaHora > accesosHoraAnterior ? 'up' : 
                     accesosUltimaHora < accesosHoraAnterior ? 'down' : 'stable'

    // Estadísticas por departamento (hoy)
    const estadisticasDepartamento: Record<string, any> = {}
    accesosHoy?.forEach(acceso => {
      const dept = acceso.usuarios.departamento || 'Sin departamento'
      if (!estadisticasDepartamento[dept]) {
        estadisticasDepartamento[dept] = {
          total: 0,
          empleados: new Set()
        }
      }
      estadisticasDepartamento[dept].total++
      estadisticasDepartamento[dept].empleados.add(acceso.usuario_id)
    })

    // Convertir Sets a números
    Object.keys(estadisticasDepartamento).forEach(dept => {
      estadisticasDepartamento[dept].empleados = estadisticasDepartamento[dept].empleados.size
    })

    // Detectar anomalías/alertas
    const alertas = []
    
    // Alerta por picos inusuales
    const promedioAccesosHora = (accesosHoy?.length || 0) / 24
    if (accesosUltimaHora > promedioAccesosHora * 2 && accesosUltimaHora > 10) {
      alertas.push({
        tipo: 'pico_accesos',
        severidad: 'warning',
        mensaje: `Pico inusual de accesos: ${accesosUltimaHora} en la última hora`,
        timestamp: ahora.toISOString()
      })
    }

    // Alerta por actividad fuera de horario
    if ((horaActual < 6 || horaActual > 22) && accesosRecientes && accesosRecientes.length > 0) {
      alertas.push({
        tipo: 'horario_inusual',
        severidad: 'info',
        mensaje: `Actividad detectada fuera del horario normal: ${accesosRecientes.length} accesos recientes`,
        timestamp: ahora.toISOString()
      })
    }

    const respuesta = {
      timestamp: ahora.toISOString(),
      turno_actual: turnoActual,
      resumen: {
        accesos_hoy: accesosHoy?.length || 0,
        empleados_unicos_hoy: empleadosHoyUnicos.size,
        accesos_recientes_30min: accesosRecientes?.length || 0,
        empleados_recientes_30min: empleadosRecientesUnicos.size,
        total_empleados_activos: empleadosActivos?.length || 0,
        porcentaje_asistencia: empleadosActivos?.length ? 
          Math.round((empleadosHoyUnicos.size / empleadosActivos.length) * 100) : 0
      },
      tendencia: {
        direccion: tendencia,
        accesos_ultima_hora: accesosUltimaHora,
        accesos_hora_anterior: accesosHoraAnterior,
        cambio: accesosUltimaHora - accesosHoraAnterior
      },
      accesos_recientes: accesosRecientes?.slice(0, 10).map(acceso => ({
        id: acceso.id,
        empleado: {
          codigo: acceso.usuarios.codigo,
          nombre: `${acceso.usuarios.nombre} ${acceso.usuarios.apellidos}`,
          departamento: acceso.usuarios.departamento
        },
        fecha_acceso: acceso.fecha_acceso,
        tiempo_relativo: calcularTiempoRelativo(new Date(acceso.fecha_acceso), ahora)
      })) || [],
      accesos_por_hora: accesosPorHora,
      departamentos: estadisticasDepartamento,
      alertas,
      estado_sistema: {
        activo: true,
        ultimo_acceso: accesosRecientes?.[0]?.fecha_acceso || null,
        tiempo_sin_actividad: accesosRecientes?.length ? 
          Math.floor((ahora.getTime() - new Date(accesosRecientes[0].fecha_acceso).getTime()) / (1000 * 60)) : null
      }
    }

    return NextResponse.json(respuesta)
  } catch (error) {
    console.error('Error en dashboard tiempo real:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function calcularTiempoRelativo(fechaAcceso: Date, ahora: Date): string {
  const diferenciaMins = Math.floor((ahora.getTime() - fechaAcceso.getTime()) / (1000 * 60))
  
  if (diferenciaMins < 1) return 'Ahora mismo'
  if (diferenciaMins < 60) return `Hace ${diferenciaMins} min${diferenciaMins !== 1 ? 's' : ''}`
  
  const diferenciaHoras = Math.floor(diferenciaMins / 60)
  if (diferenciaHoras < 24) return `Hace ${diferenciaHoras} hora${diferenciaHoras !== 1 ? 's' : ''}`
  
  const diferenciaDias = Math.floor(diferenciaHoras / 24)
  return `Hace ${diferenciaDias} día${diferenciaDias !== 1 ? 's' : ''}`
}