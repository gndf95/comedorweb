import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Primero verificar conexión
    console.log('Verificando conexión a Supabase...')
    
    // Listar todas las tablas
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    console.log('Tablas disponibles:', tables)

    // Intentar obtener usuarios
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .limit(5)

    console.log('Usuarios encontrados:', usuarios)
    console.log('Error de usuarios:', usuariosError)

    return NextResponse.json({
      success: true,
      tables: tables || [],
      usuarios: usuarios || [],
      errors: {
        tablesError,
        usuariosError
      }
    })
  } catch (error) {
    console.error('Error en test:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}