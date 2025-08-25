import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaParam = searchParams.get('fecha') || new Date().toISOString().split('T')[0]
    
    // Extraer año y mes
    const fecha = new Date(fechaParam)
    const año = fecha.getFullYear()
    const mes = fecha.getMonth()
    
    // Primer y último día del mes
    const primerDia = new Date(año, mes, 1)
    const ultimoDia = new Date(año, mes + 1, 0)

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
      .gte('fecha_acceso', primerDia.toISOString().split('T')[0])
      .lte('fecha_acceso', ultimoDia.toISOString().split('T')[0] + 'T23:59:59')
      .order('fecha_acceso', { ascending: true })

    if (error) {
      console.error('Error obteniendo accesos mensuales:', error)
      return NextResponse.json({ error: 'Error obteniendo accesos' }, { status: 500 })
    }

    const turnos = {
      desayuno: { inicio: 6, fin: 9, nombre: 'Desayuno' },
      almuerzo: { inicio: 11, fin: 15, nombre: 'Almuerzo' },
      cena: { inicio: 17, fin: 20, nombre: 'Cena' },
      nocturno: { inicio: 20, fin: 24, nombre: 'Nocturno' }
    }

    const diasMes = ultimoDia.getDate()
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    // Inicializar estadísticas
    const estadisticasPorDia: Record<string, any> = {}
    const estadisticasPorSemana: Record<number, any> = {}
    const estadisticasPorTurno: Record<string, any> = {}
    const empleadosUnicosGlobal = new Set<string>()
    const estadisticasPorDepartamento: Record<string, any> = {}

    // Inicializar días del mes
    for (let dia = 1; dia <= diasMes; dia++) {
      const fechaDia = new Date(año, mes, dia)
      const fechaStr = fechaDia.toISOString().split('T')[0]
      
      estadisticasPorDia[fechaStr] = {
        dia: dia,
        dia_semana: fechaDia.toLocaleDateString('es-ES', { weekday: 'long' }),
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

    // Inicializar semanas (1-5)
    for (let semana = 1; semana <= 5; semana++) {
      estadisticasPorSemana[semana] = {
        semana: semana,
        total_accesos: 0,
        empleados_unicos: new Set<string>(),
        por_turno: {}
      }

      Object.keys(turnos).forEach(turno => {
        estadisticasPorSemana[semana].por_turno[turno] = {
          accesos: 0,
          empleados: new Set<string>()
        }
      })
    }

    // Inicializar turnos
    Object.keys(turnos).forEach(turno => {
      estadisticasPorTurno[turno] = {
        nombre: turnos[turno as keyof typeof turnos].nombre,
        total_accesos: 0,
        empleados_unicos: new Set<string>(),
        promedio_diario: 0,
        dias_activos: 0,
        mejor_dia: { fecha: '', dia: 0, accesos: 0 },
        peor_dia: { fecha: '', dia: 0, accesos: Number.MAX_SAFE_INTEGER }
      }
    })

    // Procesar accesos
    accesos?.forEach(acceso => {
      const fecha_acceso = new Date(acceso.fecha_acceso)
      const fechaStr = fecha_acceso.toISOString().split('T')[0]
      const hora = fecha_acceso.getHours()
      const semanaDelMes = Math.ceil(fecha_acceso.getDate() / 7)

      empleadosUnicosGlobal.add(acceso.usuario_id)

      // Estadísticas por departamento
      const dept = acceso.usuarios.departamento || 'Sin departamento'
      if (!estadisticasPorDepartamento[dept]) {
        estadisticasPorDepartamento[dept] = {
          nombre: dept,
          total_accesos: 0,
          empleados_unicos: new Set<string>(),
          por_turno: {}
        }
        Object.keys(turnos).forEach(turno => {
          estadisticasPorDepartamento[dept].por_turno[turno] = 0
        })
      }
      estadisticasPorDepartamento[dept].total_accesos++
      estadisticasPorDepartamento[dept].empleados_unicos.add(acceso.usuario_id)

      if (estadisticasPorDia[fechaStr]) {
        estadisticasPorDia[fechaStr].total_accesos++
        estadisticasPorDia[fechaStr].empleados_unicos.add(acceso.usuario_id)

        // Determinar turno
        let turnoAcceso = 'nocturno'
        if (hora >= 6 && hora < 9) turnoAcceso = 'desayuno'
        else if (hora >= 11 && hora < 15) turnoAcceso = 'almuerzo'
        else if (hora >= 17 && hora < 20) turnoAcceso = 'cena'

        // Por día
        estadisticasPorDia[fechaStr].por_turno[turnoAcceso].accesos++
        estadisticasPorDia[fechaStr].por_turno[turnoAcceso].empleados.add(acceso.usuario_id)

        // Por semana
        if (estadisticasPorSemana[semanaDelMes]) {
          estadisticasPorSemana[semanaDelMes].total_accesos++
          estadisticasPorSemana[semanaDelMes].empleados_unicos.add(acceso.usuario_id)
          estadisticasPorSemana[semanaDelMes].por_turno[turnoAcceso].accesos++
          estadisticasPorSemana[semanaDelMes].por_turno[turnoAcceso].empleados.add(acceso.usuario_id)
        }

        // Por turno
        estadisticasPorTurno[turnoAcceso].total_accesos++
        estadisticasPorTurno[turnoAcceso].empleados_unicos.add(acceso.usuario_id)

        // Por departamento y turno
        estadisticasPorDepartamento[dept].por_turno[turnoAcceso]++
      }
    })

    // Finalizar procesamiento
    Object.keys(estadisticasPorDia).forEach(fecha => {
      const dia = estadisticasPorDia[fecha]
      dia.empleados_unicos = dia.empleados_unicos.size

      Object.keys(dia.por_turno).forEach(turno => {
        const accesosTurno = dia.por_turno[turno].accesos
        dia.por_turno[turno].empleados = dia.por_turno[turno].empleados.size

        // Actualizar estadísticas de turno
        if (accesosTurno > 0) {
          estadisticasPorTurno[turno].dias_activos++
        }
        
        if (accesosTurno > estadisticasPorTurno[turno].mejor_dia.accesos) {
          estadisticasPorTurno[turno].mejor_dia = { 
            fecha, 
            dia: dia.dia, 
            accesos: accesosTurno 
          }
        }
        if (accesosTurno < estadisticasPorTurno[turno].peor_dia.accesos && accesosTurno > 0) {
          estadisticasPorTurno[turno].peor_dia = { 
            fecha, 
            dia: dia.dia, 
            accesos: accesosTurno 
          }
        }
      })
    })

    // Procesar semanas y departamentos
    Object.keys(estadisticasPorSemana).forEach(semana => {
      const semanaData = estadisticasPorSemana[semana]
      semanaData.empleados_unicos = semanaData.empleados_unicos.size

      Object.keys(semanaData.por_turno).forEach(turno => {
        semanaData.por_turno[turno].empleados = semanaData.por_turno[turno].empleados.size
      })
    })

    Object.keys(estadisticasPorDepartamento).forEach(dept => {
      estadisticasPorDepartamento[dept].empleados_unicos = 
        estadisticasPorDepartamento[dept].empleados_unicos.size
    })

    // Calcular promedios para turnos
    Object.keys(estadisticasPorTurno).forEach(turno => {
      estadisticasPorTurno[turno].empleados_unicos = estadisticasPorTurno[turno].empleados_unicos.size
      estadisticasPorTurno[turno].promedio_diario = 
        Math.round(estadisticasPorTurno[turno].total_accesos / diasMes)
    })

    const estadisticas = {
      mes: {
        año: año,
        mes: mes + 1,
        nombre: meses[mes],
        dias_totales: diasMes,
        primer_dia: primerDia.toISOString().split('T')[0],
        ultimo_dia: ultimoDia.toISOString().split('T')[0]
      },
      resumen: {
        total_accesos: accesos?.length || 0,
        empleados_unicos: empleadosUnicosGlobal.size,
        promedio_diario: Math.round((accesos?.length || 0) / diasMes),
        dias_con_actividad: Object.values(estadisticasPorDia)
          .filter((dia: any) => dia.total_accesos > 0).length
      },
      por_dia: estadisticasPorDia,
      por_semana: estadisticasPorSemana,
      por_turno: estadisticasPorTurno,
      por_departamento: estadisticasPorDepartamento,
      dia_mas_activo: Object.entries(estadisticasPorDia)
        .sort(([,a]: [string, any], [,b]: [string, any]) => b.total_accesos - a.total_accesos)[0],
      turno_mas_activo: Object.entries(estadisticasPorTurno)
        .sort(([,a]: [string, any], [,b]: [string, any]) => b.total_accesos - a.total_accesos)[0]
    }

    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error('Error en estadísticas mensuales:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}