import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const [
      { data: usuarios },
      { data: accesosHoy }
    ] = await Promise.all([
      supabaseAdmin
        .from('usuarios')
        .select('id, activo, tipo'),
      
      supabaseAdmin
        .from('accesos')
        .select('id')
        .gte('fecha_acceso', new Date().toISOString().split('T')[0])
    ])

    const estadisticas = {
      total: usuarios?.length || 0,
      activos: usuarios?.filter(u => u.activo).length || 0,
      inactivos: usuarios?.filter(u => !u.activo).length || 0,
      empleados: usuarios?.filter(u => u.tipo?.toLowerCase() === 'empleado').length || 0,
      externos: usuarios?.filter(u => u.tipo?.toLowerCase() !== 'empleado').length || 0,
      accesos_hoy: accesosHoy?.length || 0
    }

    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error('Error obteniendo estadísticas de empleados:', error)
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 })
  }
}