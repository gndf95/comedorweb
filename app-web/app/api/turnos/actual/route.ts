import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutoActual = ahora.getMinutes()
    const minutosActuales = horaActual * 60 + minutoActual
    
    // Intentar obtener turnos desde base de datos primero
    let turnos = []
    try {
      const { data: turnosDB, error } = await supabaseAdmin
        .from('turnos_config')
        .select('*')
        .eq('activo', true)
        .order('hora_inicio')

      if (!error && turnosDB && turnosDB.length > 0) {
        turnos = turnosDB.map(t => ({
          id: t.id || t.turno,
          nombre: t.descripcion || t.turno || t.nombre,
          hora_inicio: t.hora_inicio,
          hora_fin: t.hora_fin,
          inicio_minutos: convertirHoraAMinutos(t.hora_inicio),
          fin_minutos: convertirHoraAMinutos(t.hora_fin)
        }))
      }
    } catch (dbError) {
      console.log('No se pudo obtener turnos de la DB, usando configuración por defecto')
    }
    
    // Si no hay turnos en la DB, usar configuración por defecto
    if (turnos.length === 0) {
      turnos = [
        {
          id: 'desayuno',
          nombre: 'Desayuno',
          hora_inicio: '06:00',
          hora_fin: '09:00',
          inicio_minutos: 6 * 60,
          fin_minutos: 9 * 60
        },
        {
          id: 'almuerzo',
          nombre: 'Almuerzo',
          hora_inicio: '11:00',
          hora_fin: '15:00',
          inicio_minutos: 11 * 60,
          fin_minutos: 15 * 60
        },
        {
          id: 'cena',
          nombre: 'Cena',
          hora_inicio: '17:00',
          hora_fin: '20:00',
          inicio_minutos: 17 * 60,
          fin_minutos: 20 * 60
        },
        {
          id: 'nocturno',
          nombre: 'Nocturno',
          hora_inicio: '20:00',
          hora_fin: '23:00',
          inicio_minutos: 20 * 60,
          fin_minutos: 23 * 60
        }
      ]
    }
    
    // Encontrar turno actual
    const turnoActual = turnos.find(turno => 
      minutosActuales >= turno.inicio_minutos && minutosActuales <= turno.fin_minutos
    )

    if (turnoActual) {
      // Calcular progreso del turno actual
      const duracionTurno = turnoActual.fin_minutos - turnoActual.inicio_minutos
      const tiempoTranscurrido = minutosActuales - turnoActual.inicio_minutos
      const progreso = Math.max(0, Math.min(100, (tiempoTranscurrido / duracionTurno) * 100))

      return NextResponse.json({
        id: turnoActual.id,
        nombre: turnoActual.nombre,
        hora_inicio: turnoActual.hora_inicio,
        hora_fin: turnoActual.hora_fin,
        activo: true,
        progreso: progreso,
        tiempo_restante_minutos: Math.max(0, turnoActual.fin_minutos - minutosActuales),
        accesos_actual: 0
      })
    } else {
      // No hay turno activo, determinar el próximo
      const proximoTurno = turnos.find(turno => minutosActuales < turno.inicio_minutos) ||
                          turnos[0] // Si pasaron todos los turnos, el próximo es el primero del día siguiente

      const tiempoHastaProximo = proximoTurno.inicio_minutos > minutosActuales 
        ? proximoTurno.inicio_minutos - minutosActuales
        : (24 * 60) - minutosActuales + proximoTurno.inicio_minutos

      return NextResponse.json({
        id: null,
        nombre: 'Fuera de horario',
        hora_inicio: null,
        hora_fin: null,
        activo: false,
        progreso: 0,
        proximo_turno: {
          nombre: proximoTurno.nombre,
          hora_inicio: proximoTurno.hora_inicio,
          tiempo_hasta_inicio_minutos: tiempoHastaProximo
        },
        accesos_actual: 0
      })
    }
  } catch (error) {
    console.error('Error obteniendo turno actual:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      id: null,
      nombre: 'Error',
      activo: false,
      progreso: 0,
      accesos_actual: 0
    }, { status: 500 })
  }
}

function convertirHoraAMinutos(hora: string): number {
  if (!hora) return 0
  const [horas, minutos] = hora.split(':').map(n => parseInt(n, 10))
  return (horas || 0) * 60 + (minutos || 0)
}