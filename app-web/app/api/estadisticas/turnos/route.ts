import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const fechaHoy = new Date().toISOString().split('T')[0]

    // Obtener registros del día agrupados por turno y tipo
    const { data: registrosHoy, error: registrosError } = await supabaseAdmin
      .from('registros_comedor')
      .select('turno, tipo')
      .eq('fecha', fechaHoy)

    if (registrosError) {
      console.error('Error obteniendo registros:', registrosError)
      return NextResponse.json({
        success: false,
        error: registrosError.message
      }, { status: 500 })
    }

    // Procesar estadísticas
    const porTurno: { [key: string]: { empleados: number; externos: number; total: number } } = {}
    let totalRegistros = 0

    registrosHoy.forEach(registro => {
      if (!porTurno[registro.turno]) {
        porTurno[registro.turno] = { empleados: 0, externos: 0, total: 0 }
      }

      porTurno[registro.turno].total++
      totalRegistros++

      if (registro.tipo === 'EMPLEADO') {
        porTurno[registro.turno].empleados++
      } else if (registro.tipo === 'EXTERNO') {
        porTurno[registro.turno].externos++
      }
    })

    // Asegurar que todos los turnos aparezcan (incluso con 0 registros)
    const { data: turnos, error: turnosError } = await supabaseAdmin
      .from('turnos_config')
      .select('turno')
      .eq('activo', true)

    if (!turnosError && turnos) {
      turnos.forEach(turno => {
        if (!porTurno[turno.turno]) {
          porTurno[turno.turno] = { empleados: 0, externos: 0, total: 0 }
        }
      })
    }

    const estadisticas = {
      totalRegistros,
      porTurno,
      fecha: fechaHoy,
      ultimaActualizacion: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      estadisticas,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error en API estadísticas turnos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}