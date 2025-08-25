import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: turnos, error } = await supabase
      .from('turnos_config')
      .select('*')
      .order('hora_inicio')

    if (error) {
      console.error('Error obteniendo configuración de turnos:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        turnos: []
      })
    }

    return NextResponse.json({
      success: true,
      turnos: turnos || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error en API configuración turnos:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      turnos: []
    }, { status: 500 })
  }
}