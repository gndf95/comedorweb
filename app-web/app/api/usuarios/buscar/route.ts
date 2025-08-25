import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const codigo = searchParams.get('codigo')

    if (!codigo) {
      return NextResponse.json({
        success: false,
        error: 'Código requerido',
        usuario: null
      }, { status: 400 })
    }

    // Buscar usuario directamente con supabaseAdmin (bypassa RLS)
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('codigo', codigo)
      .eq('activo', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error buscando usuario: ${error.message}`)
    }

    if (!usuario) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado',
        usuario: null
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      usuario,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error buscando usuario:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      usuario: null
    }, { status: 500 })
  }
}