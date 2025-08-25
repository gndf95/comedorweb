import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const turno = await request.json()

    const { data, error } = await supabaseAdmin
      .from('turnos_config')
      .upsert({
        id: turno.id.startsWith('temp_') ? undefined : turno.id, // Para nuevos turnos
        turno: turno.turno,
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
        activo: turno.activo,
        descripcion: turno.descripcion
      })
      .select()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data?.[0],
      message: 'Turno actualizado correctamente'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}