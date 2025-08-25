import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]

    // Obtener accesos del día específico agrupados por turno
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
      .gte('fecha_acceso', `${fecha}T00:00:00`)
      .lt('fecha_acceso', `${fecha}T23:59:59`)
      .order('fecha_acceso', { ascending: true })

    if (error) {
      console.error('Error obteniendo accesos diarios:', error)
      return NextResponse.json({ error: 'Error obteniendo accesos' }, { status: 500 })
    }

    // Definir turnos
    const turnos = {
      desayuno: { inicio: 6, fin: 9, nombre: 'Desayuno (6:00-9:00)' },
      almuerzo: { inicio: 11, fin: 15, nombre: 'Almuerzo (11:00-15:00)' },
      cena: { inicio: 17, fin: 20, nombre: 'Cena (17:00-20:00)' },
      nocturno: { inicio: 20, fin: 24, nombre: 'Nocturno (20:00-24:00)' },
      madrugada: { inicio: 0, fin: 6, nombre: 'Madrugada (0:00-6:00)' }
    }

    // Procesar accesos por turno
    const estadisticasTurnos: Record<string, any> = {}
    const empleadosUnicos = new Set<string>()
    const accesosPorHora: Record<number, number> = {}

    // Inicializar contadores
    Object.keys(turnos).forEach(turno => {
      estadisticasTurnos[turno] = {
        nombre: turnos[turno as keyof typeof turnos].nombre,
        total_accesos: 0,
        empleados_unicos: new Set<string>(),
        accesos: [],
        por_departamento: {} as Record<string, number>,
        por_tipo: { empleado: 0, externo: 0 }
      }
    })

    // Inicializar horas
    for (let i = 0; i < 24; i++) {
      accesosPorHora[i] = 0
    }

    // Procesar cada acceso
    accesos?.forEach(acceso => {
      const fecha_acceso = new Date(acceso.fecha_acceso)
      const hora = fecha_acceso.getHours()
      
      // Contar accesos por hora
      accesosPorHora[hora] = (accesosPorHora[hora] || 0) + 1
      
      // Determinar turno
      let turnoAcceso = 'nocturno' // por defecto
      
      if (hora >= 0 && hora < 6) turnoAcceso = 'madrugada'
      else if (hora >= 6 && hora < 9) turnoAcceso = 'desayuno'
      else if (hora >= 11 && hora < 15) turnoAcceso = 'almuerzo'
      else if (hora >= 17 && hora < 20) turnoAcceso = 'cena'
      else if (hora >= 20 || hora < 1) turnoAcceso = 'nocturno'

      // Agregar a estadísticas del turno
      if (estadisticasTurnos[turnoAcceso]) {
        estadisticasTurnos[turnoAcceso].total_accesos++
        estadisticasTurnos[turnoAcceso].empleados_unicos.add(acceso.usuario_id)
        estadisticasTurnos[turnoAcceso].accesos.push({
          ...acceso,
          hora: hora,
          minuto: fecha_acceso.getMinutes()
        })

        // Por departamento
        const dept = acceso.usuarios.departamento || 'Sin departamento'
        estadisticasTurnos[turnoAcceso].por_departamento[dept] = 
          (estadisticasTurnos[turnoAcceso].por_departamento[dept] || 0) + 1

        // Por tipo
        const tipo = acceso.usuarios.tipo?.toLowerCase() === 'empleado' ? 'empleado' : 'externo'
        estadisticasTurnos[turnoAcceso].por_tipo[tipo]++
      }

      empleadosUnicos.add(acceso.usuario_id)
    })

    // Convertir Sets a números
    Object.keys(estadisticasTurnos).forEach(turno => {
      estadisticasTurnos[turno].empleados_unicos = estadisticasTurnos[turno].empleados_unicos.size
    })

    const estadisticas = {
      fecha,
      resumen: {
        total_accesos: accesos?.length || 0,
        empleados_unicos: empleadosUnicos.size,
        turnos_activos: Object.values(estadisticasTurnos).filter((t: any) => t.total_accesos > 0).length
      },
      por_turno: estadisticasTurnos,
      por_hora: accesosPorHora,
      turno_mas_activo: Object.entries(estadisticasTurnos)
        .sort(([,a]: [string, any], [,b]: [string, any]) => b.total_accesos - a.total_accesos)[0]
    }

    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error('Error en estadísticas diarias:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}