import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID requerido'
      }, { status: 400 })
    }

    // Verificar si hay registros asociados a este turno
    const { data: registros, error: registrosError } = await supabaseAdmin
      .from('registros_comedor')
      .select('id')
      .eq('turno', id)
      .limit(1)

    if (registrosError) {
      return NextResponse.json({
        success: false,
        error: 'Error verificando registros asociados'
      }, { status: 500 })
    }

    if (registros && registros.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'No se puede eliminar un turno que tiene registros asociados'
      }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('turnos_config')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Turno eliminado correctamente'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}