import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Obteniendo configuración de turnos...')
    const { data: turnos, error } = await supabaseAdmin
      .from('turnos_config')
      .select('*')
      .order('hora_inicio')

    console.log('Resultado query turnos_config:', { turnos, error })

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