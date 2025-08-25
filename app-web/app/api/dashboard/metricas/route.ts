import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const hoy = new Date().toISOString().split('T')[0]
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [
      { data: accesosHoy },
      { data: empleadosActivos },
      { data: turnosActivos },
      { data: accesosSemana },
      { data: turnosCompletados }
    ] = await Promise.all([
      // Accesos de hoy
      supabaseAdmin
        .from('accesos')
        .select('id')
        .gte('fecha_acceso', hoy),

      // Empleados activos
      supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('activo', true),

      // Turnos activos
      supabaseAdmin
        .from('turnos')
        .select('id')
        .eq('activo', true),

      // Accesos de la semana para promedio
      supabaseAdmin
        .from('accesos')
        .select('fecha_acceso')
        .gte('fecha_acceso', hace7Dias),

      // Turnos completados hoy (asumimos que un turno se "completa" si ha pasado su hora_fin)
      supabaseAdmin
        .from('turnos')
        .select('hora_fin')
        .eq('activo', true)
    ])

    // Calcular promedio de accesos por semana
    const accesosAgrupados = (accesosSemana || []).reduce((acc: { [key: string]: number }, acceso) => {
      const fecha = acceso.fecha_acceso.split('T')[0]
      acc[fecha] = (acc[fecha] || 0) + 1
      return acc
    }, {})

    const promedioAccesos = Object.values(accesosAgrupados).length > 0 
      ? Math.round(Object.values(accesosAgrupados).reduce((sum: number, count: number) => sum + count, 0) / Object.values(accesosAgrupados).length)
      : 0

    // Encontrar hora pico (simplificado - se podría mejorar)
    const { data: accesosPorHora } = await supabaseAdmin.rpc('obtener_accesos_por_hora_hoy')
    
    let horaPico = '12:00'
    if (accesosPorHora && accesosPorHora.length > 0) {
      const maxAccesos = Math.max(...accesosPorHora.map((h: any) => h.accesos))
      const horaPicoObj = accesosPorHora.find((h: any) => h.accesos === maxAccesos)
      if (horaPicoObj) {
        horaPico = horaPicoObj.hora
      }
    }

    // Calcular turnos completados hoy
    const ahora = new Date()
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes()
    
    const turnosCompletadosHoy = (turnosCompletados || []).filter(turno => {
      const [hora, minuto] = turno.hora_fin.split(':').map(Number)
      const horaFinMinutos = hora * 60 + minuto
      return horaFinMinutos <= horaActual
    }).length

    const metricas = {
      accesos_hoy: accesosHoy?.length || 0,
      empleados_activos: empleadosActivos?.length || 0,
      turnos_activos: turnosActivos?.length || 0,
      promedio_accesos_semana: promedioAccesos,
      pico_accesos_hora: horaPico,
      turnos_completados_hoy: turnosCompletadosHoy
    }

    return NextResponse.json(metricas)
  } catch (error) {
    console.error('Error obteniendo métricas dashboard:', error)
    return NextResponse.json({ 
      accesos_hoy: 0,
      empleados_activos: 0,
      turnos_activos: 0,
      promedio_accesos_semana: 0,
      pico_accesos_hora: '12:00',
      turnos_completados_hoy: 0
    })
  }
}