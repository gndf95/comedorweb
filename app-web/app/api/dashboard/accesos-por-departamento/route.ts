import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const hoy = new Date().toISOString().split('T')[0]

    // Obtener accesos de hoy con información del usuario
    const { data: accesos, error } = await supabaseAdmin
      .from('accesos')
      .select(`
        id,
        usuarios!inner(departamento)
      `)
      .gte('fecha_acceso', hoy)
      .lt('fecha_acceso', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    if (error) {
      console.error('Error obteniendo accesos por departamento:', error)
      return NextResponse.json([])
    }

    // Agrupar por departamento
    const accesosPorDepartamento: { [key: string]: number } = {}

    if (accesos) {
      accesos.forEach(acceso => {
        const departamento = acceso.usuarios?.departamento || 'Sin Departamento'
        accesosPorDepartamento[departamento] = (accesosPorDepartamento[departamento] || 0) + 1
      })
    }

    // Convertir a array y ordenar por número de accesos (descendente)
    const resultado = Object.entries(accesosPorDepartamento)
      .map(([departamento, accesos]) => ({ departamento, accesos }))
      .sort((a, b) => b.accesos - a.accesos)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error en GET /api/dashboard/accesos-por-departamento:', error)
    return NextResponse.json([])
  }
}