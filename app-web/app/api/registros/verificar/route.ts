import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { usuarioId, turno, fecha } = body

    if (!usuarioId || !turno) {
      return NextResponse.json({
        success: false,
        error: 'usuarioId y turno son requeridos',
        yaEscaneo: false
      }, { status: 400 })
    }

    // Verificar si ya escaneó en el turno actual
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabaseAdmin
      .from('registros_comedor')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('turno', turno)
      .eq('fecha', fechaConsulta)
      .limit(1)

    if (error) {
      throw new Error(`Error verificando entrada: ${error.message}`)
    }

    const yaEscaneo = data && data.length > 0

    return NextResponse.json({
      success: true,
      yaEscaneo,
      usuarioId,
      turno,
      fecha: fecha || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error verificando entrada:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      yaEscaneo: false
    }, { status: 500 })
  }
}