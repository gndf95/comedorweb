import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Obtener estadísticas generales
    const [usuarios, registros, turnos] = await Promise.all([
      supabaseAdmin.from('usuarios').select('*').order('codigo'),
      supabaseAdmin.from('registros_comedor').select('*').order('timestamp_completo', { ascending: false }).limit(10),
      supabaseAdmin.from('turnos_config').select('*').order('hora_inicio')
    ])

    // Contar totales
    const [countUsuarios, countRegistros] = await Promise.all([
      supabaseAdmin.from('usuarios').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('registros_comedor').select('id', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      success: true,
      resumen: {
        totalUsuarios: countUsuarios.count,
        totalRegistros: countRegistros.count,
        fechaConsulta: new Date().toISOString()
      },
      datos: {
        usuarios: usuarios.data || [],
        ultimosRegistros: registros.data || [],
        turnos: turnos.data || []
      },
      errores: {
        usuarios: usuarios.error?.message || null,
        registros: registros.error?.message || null,
        turnos: turnos.error?.message || null
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}