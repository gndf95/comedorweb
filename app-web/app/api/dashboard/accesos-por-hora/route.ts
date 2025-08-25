import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const hoy = new Date().toISOString().split('T')[0]

    // Obtener todos los accesos de hoy
    const { data: accesos, error } = await supabaseAdmin
      .from('accesos')
      .select('hora_acceso')
      .gte('fecha_acceso', hoy)
      .lt('fecha_acceso', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    if (error) {
      console.error('Error obteniendo accesos por hora:', error)
      return NextResponse.json([])
    }

    // Agrupar por hora
    const accesosPorHora: { [key: string]: number } = {}
    
    // Inicializar todas las horas del día
    for (let i = 0; i < 24; i++) {
      const hora = i.toString().padStart(2, '0') + ':00'
      accesosPorHora[hora] = 0
    }

    // Contar accesos por hora
    if (accesos) {
      accesos.forEach(acceso => {
        if (acceso.hora_acceso) {
          const hora = acceso.hora_acceso.split(':')[0] + ':00'
          if (accesosPorHora.hasOwnProperty(hora)) {
            accesosPorHora[hora]++
          }
        }
      })
    }

    // Convertir a array y ordenar
    const resultado = Object.entries(accesosPorHora)
      .map(([hora, accesos]) => ({ hora, accesos }))
      .sort((a, b) => a.hora.localeCompare(b.hora))

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error en GET /api/dashboard/accesos-por-hora:', error)
    return NextResponse.json([])
  }
}