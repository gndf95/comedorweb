import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    const { data: empleado, error } = await supabaseAdmin
      .from('usuarios')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando empleado:', error)
      return NextResponse.json({ error: 'Error actualizando empleado' }, { status: 500 })
    }

    return NextResponse.json(empleado)
  } catch (error) {
    console.error('Error en PUT /api/empleados/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error eliminando empleado:', error)
      return NextResponse.json({ error: 'Error eliminando empleado' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en DELETE /api/empleados/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}