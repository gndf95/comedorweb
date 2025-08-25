import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      usuarioId, 
      codigo, 
      nombre, 
      tipo, 
      turno, 
      dispositivo = 'KIOSCO_WEB',
      metodoEntrada = 'SCANNER_USB' 
    } = body

    if (!usuarioId || !codigo || !nombre || !tipo || !turno) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: usuarioId, codigo, nombre, tipo, turno',
        registro: null
      }, { status: 400 })
    }

    // Validar tipo
    if (!['EMPLEADO', 'EXTERNO'].includes(tipo)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo debe ser EMPLEADO o EXTERNO',
        registro: null
      }, { status: 400 })
    }

    // Registrar entrada directamente en la base de datos
    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0]
    const hora = ahora.toTimeString().split(' ')[0]

    const { data: registro, error: registroError } = await supabaseAdmin
      .from('registros_comedor')
      .insert({
        usuario_id: usuarioId,
        fecha,
        hora,
        turno,
        codigo,
        nombre,
        tipo,
        dispositivo,
        metodo_entrada: metodoEntrada,
        timestamp_completo: ahora.toISOString(),
      })
      .select()
      .single()

    if (registroError) {
      throw new Error(`Error registrando entrada: ${registroError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Entrada registrada exitosamente',
      registro,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error registrando entrada:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      registro: null
    }, { status: 500 })
  }
}