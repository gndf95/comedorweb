import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Intentar conectar con Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Error conectando con la base de datos',
        details: {
          code: error.code,
          hint: error.hint,
          suggestion: 'Verificar que las migraciones SQL se hayan ejecutado en Supabase'
        }
      }, { status: 500 })
    }

    // Si llegamos aquí, la conexión fue exitosa
    return NextResponse.json({
      success: true,
      message: 'Conexión con Supabase establecida correctamente',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        project: 'unigberekthjkrgmjxjs',
        region: 'us-east-1'
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error interno del sistema'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Test de inserción básica (usuario de prueba)
    const testUser = {
      codigo: 'TEST001',
      nombre: 'USUARIO PRUEBA API',
      tipo: 'EMPLEADO',
      activo: true,
      email: 'test@sistema-comedor.local',
      departamento: 'API_TEST'
    }

    const { data, error } = await supabase
      .from('usuarios')
      .insert(testUser)
      .select()

    if (error) {
      if (error.code === '23505') {
        // Usuario ya existe
        return NextResponse.json({
          success: true,
          message: 'Usuario de prueba ya existe - Base de datos funcionando',
          data: { codigo: testUser.codigo, status: 'exists' }
        })
      }

      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Error insertando datos de prueba'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario de prueba creado exitosamente',
      data: data[0]
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error en test de inserción'
    }, { status: 500 })
  }
}