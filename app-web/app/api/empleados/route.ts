import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: empleados, error } = await supabaseAdmin
      .from('usuarios')
      .select(`
        id,
        codigo,
        nombre,
        email,
        telefono,
        departamento,
        activo,
        fecha_creacion,
        fecha_actualizacion,
        tipo
      `)
      .order('fecha_creacion', { ascending: false })

    if (error) {
      console.error('Error obteniendo empleados:', error)
      return NextResponse.json({ error: 'Error obteniendo empleados' }, { status: 500 })
    }

    // Transformar datos para que coincidan con el frontend
    const empleadosTransformados = (empleados || []).map(emp => ({
      id: emp.id,
      codigo: emp.codigo,
      nombre: emp.nombre?.split(' ')[0] || emp.nombre || '',
      apellidos: emp.nombre?.split(' ').slice(1).join(' ') || '',
      email: emp.email,
      telefono: emp.telefono,
      departamento: emp.departamento,
      activo: emp.activo,
      fecha_registro: emp.fecha_creacion,
      ultimo_acceso: emp.fecha_actualizacion,
      tipo_usuario: emp.tipo?.toLowerCase() === 'empleado' ? 'empleado' : 'externo'
    }))

    return NextResponse.json(empleadosTransformados)
  } catch (error) {
    console.error('Error en GET /api/empleados:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { codigo, nombre, apellidos, email, telefono, departamento, tipo_usuario } = body

    if (!codigo || !nombre || !apellidos) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: existente } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('codigo', codigo)
      .single()

    if (existente) {
      return NextResponse.json({ error: 'El código ya existe' }, { status: 400 })
    }

    const { data: empleado, error } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        codigo,
        nombre,
        apellidos,
        email: email || null,
        telefono: telefono || null,
        departamento: departamento || null,
        tipo_usuario: tipo_usuario || 'empleado',
        activo: true,
        fecha_registro: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creando empleado:', error)
      return NextResponse.json({ error: 'Error creando empleado' }, { status: 500 })
    }

    return NextResponse.json(empleado)
  } catch (error) {
    console.error('Error en POST /api/empleados:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}