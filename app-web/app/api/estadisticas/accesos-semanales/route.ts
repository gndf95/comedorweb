import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]
    
    // Calcular inicio y fin de la semana
    const fechaActual = new Date(fecha)
    const diaSemana = fechaActual.getDay()
    const inicioSemana = new Date(fechaActual)
    inicioSemana.setDate(fechaActual.getDate() - diaSemana)
    const finSemana = new Date(inicioSemana)
    finSemana.setDate(inicioSemana.getDate() + 6)

    const { data: accesos, error } = await supabaseAdmin
      .from('accesos')
      .select(`
        id,
        fecha_acceso,
        usuario_id,
        usuarios!inner(
          id,
          nombre,
          apellidos,
          codigo,
          departamento,
          tipo
        )
      `)
      .gte('fecha_acceso', inicioSemana.toISOString().split('T')[0])
      .lte('fecha_acceso', finSemana.toISOString().split('T')[0] + 'T23:59:59')
      .order('fecha_acceso', { ascending: true })

    if (error) {
      console.error('Error obteniendo accesos semanales:', error)
      return NextResponse.json({ error: 'Error obteniendo accesos' }, { status: 500 })
    }

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const turnos = {
      desayuno: { inicio: 6, fin: 9, nombre: 'Desayuno' },
      almuerzo: { inicio: 11, fin: 15, nombre: 'Almuerzo' },
      cena: { inicio: 17, fin: 20, nombre: 'Cena' },
      nocturno: { inicio: 20, fin: 24, nombre: 'Nocturno' }
    }

    // Inicializar estadísticas por día
    const estadisticasPorDia: Record<string, any> = {}
    const empleadosUnicosGlobal = new Set<string>()
    const estadisticasPorTurno: Record<string, any> = {}

    // Inicializar días
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana)
      dia.setDate(inicioSemana.getDate() + i)
      const fechaStr = dia.toISOString().split('T')[0]
      
      estadisticasPorDia[fechaStr] = {
        dia_semana: diasSemana[dia.getDay()],
        fecha: fechaStr,
        total_accesos: 0,
        empleados_unicos: new Set<string>(),
        por_turno: {}
      }

      Object.keys(turnos).forEach(turno => {
        estadisticasPorDia[fechaStr].por_turno[turno] = {
          accesos: 0,
          empleados: new Set<string>()
        }
      })
    }

    // Inicializar estadísticas por turno
    Object.keys(turnos).forEach(turno => {
      estadisticasPorTurno[turno] = {
        nombre: turnos[turno as keyof typeof turnos].nombre,
        total_accesos: 0,
        empleados_unicos: new Set<string>(),
        promedio_diario: 0,
        mejor_dia: { dia: '', accesos: 0 },
        peor_dia: { dia: '', accesos: Number.MAX_SAFE_INTEGER }
      }
    })

    // Procesar accesos
    accesos?.forEach(acceso => {
      const fecha_acceso = new Date(acceso.fecha_acceso)
      const fechaStr = fecha_acceso.toISOString().split('T')[0]
      const hora = fecha_acceso.getHours()

      empleadosUnicosGlobal.add(acceso.usuario_id)

      if (estadisticasPorDia[fechaStr]) {
        estadisticasPorDia[fechaStr].total_accesos++
        estadisticasPorDia[fechaStr].empleados_unicos.add(acceso.usuario_id)

        // Determinar turno
        let turnoAcceso = 'nocturno'
        if (hora >= 6 && hora < 9) turnoAcceso = 'desayuno'
        else if (hora >= 11 && hora < 15) turnoAcceso = 'almuerzo'
        else if (hora >= 17 && hora < 20) turnoAcceso = 'cena'

        estadisticasPorDia[fechaStr].por_turno[turnoAcceso].accesos++
        estadisticasPorDia[fechaStr].por_turno[turnoAcceso].empleados.add(acceso.usuario_id)

        estadisticasPorTurno[turnoAcceso].total_accesos++
        estadisticasPorTurno[turnoAcceso].empleados_unicos.add(acceso.usuario_id)
      }
    })

    // Finalizar procesamiento
    Object.keys(estadisticasPorDia).forEach(fecha => {
      const dia = estadisticasPorDia[fecha]
      dia.empleados_unicos = dia.empleados_unicos.size

      Object.keys(dia.por_turno).forEach(turno => {
        const accesosTurno = dia.por_turno[turno].accesos
        dia.por_turno[turno].empleados = dia.por_turno[turno].empleados.size

        // Actualizar mejor y peor día por turno
        if (accesosTurno > estadisticasPorTurno[turno].mejor_dia.accesos) {
          estadisticasPorTurno[turno].mejor_dia = { dia: dia.dia_semana, accesos: accesosTurno }
        }
        if (accesosTurno < estadisticasPorTurno[turno].peor_dia.accesos) {
          estadisticasPorTurno[turno].peor_dia = { dia: dia.dia_semana, accesos: accesosTurno }
        }
      })
    })

    // Calcular promedios
    Object.keys(estadisticasPorTurno).forEach(turno => {
      estadisticasPorTurno[turno].empleados_unicos = estadisticasPorTurno[turno].empleados_unicos.size
      estadisticasPorTurno[turno].promedio_diario = Math.round(estadisticasPorTurno[turno].total_accesos / 7)
    })

    const estadisticas = {
      semana: {
        inicio: inicioSemana.toISOString().split('T')[0],
        fin: finSemana.toISOString().split('T')[0]
      },
      resumen: {
        total_accesos: accesos?.length || 0,
        empleados_unicos: empleadosUnicosGlobal.size,
        promedio_diario: Math.round((accesos?.length || 0) / 7)
      },
      por_dia: estadisticasPorDia,
      por_turno: estadisticasPorTurno,
      dia_mas_activo: Object.entries(estadisticasPorDia)
        .sort(([,a]: [string, any], [,b]: [string, any]) => b.total_accesos - a.total_accesos)[0]
    }

    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error('Error en estadísticas semanales:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}