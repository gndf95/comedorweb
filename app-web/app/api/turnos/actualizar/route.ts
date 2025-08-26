import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const turno = await request.json()
    console.log('API actualizar - turno recibido:', turno)
    console.log('¿Es nuevo turno?', turno.id.startsWith('temp_'))

    // Para turnos nuevos (con ID temporal), hacer insert
    // Para turnos existentes, hacer update
    let data, error
    
    if (turno.id.startsWith('temp_')) {
      console.log('Insertando nuevo turno...')
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('turnos_config')
        .insert({
          turno: turno.turno,
          hora_inicio: turno.hora_inicio,
          hora_fin: turno.hora_fin,
          activo: turno.activo,
          descripcion: turno.descripcion
        })
        .select()
      
      console.log('Resultado INSERT:', { insertData, insertError })
      data = insertData
      error = insertError
    } else {
      console.log('Actualizando turno existente, ID:', turno.id)
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('turnos_config')
        .update({
          turno: turno.turno,
          hora_inicio: turno.hora_inicio,
          hora_fin: turno.hora_fin,
          activo: turno.activo,
          descripcion: turno.descripcion
        })
        .eq('id', turno.id)
        .select()
      
      console.log('Resultado UPDATE:', { updateData, updateError })
      data = updateData
      error = updateError
    }

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