import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Configurar usuario administrador inicial
    const adminUser = {
      codigo: '0001',  // Formato 4 dígitos para EMPLEADO
      nombre: 'ADMINISTRADOR SISTEMA',
      tipo: 'EMPLEADO' as const,
      activo: true,
      email: 'admin@sistema-comedor.local',
      departamento: 'ADMINISTRACION',
      notas: 'Usuario administrador inicial del sistema'
    }

    // Insertar usuario admin usando supabaseAdmin (service role)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .upsert(adminUser, { 
        onConflict: 'codigo',
        ignoreDuplicates: false 
      })
      .select()

    if (userError) {
      console.error('Error creando admin:', userError)
      return NextResponse.json({
        success: false,
        error: userError.message,
        message: 'Error creando usuario administrador'
      }, { status: 500 })
    }

    // Crear algunos usuarios de prueba para el sistema
    const testUsers = [
      {
        codigo: '1001',
        nombre: 'JUAN PEREZ',
        tipo: 'EMPLEADO' as const,
        activo: true,
        email: 'juan.perez@empresa.com',
        departamento: 'IT'
      },
      {
        codigo: '1002', 
        nombre: 'MARIA GARCIA',
        tipo: 'EMPLEADO' as const,
        activo: true,
        email: 'maria.garcia@empresa.com',
        departamento: 'RECURSOS HUMANOS'
      },
      {
        codigo: 'EXT001',
        nombre: 'CARLOS LOPEZ',
        tipo: 'EXTERNO' as const,
        activo: true,
        email: 'carlos.lopez@contratista.com',
        departamento: 'CONTRATISTA'
      }
    ]

    const { data: testData, error: testError } = await supabaseAdmin
      .from('usuarios')
      .upsert(testUsers, { 
        onConflict: 'codigo',
        ignoreDuplicates: true 
      })
      .select()

    if (testError) {
      console.warn('Algunos usuarios de prueba ya existen:', testError.message)
    }

    // Verificar que los turnos estén configurados
    const { data: turnos, error: turnosError } = await supabaseAdmin
      .from('turnos_config')
      .select('*')

    if (turnosError || !turnos?.length) {
      // Insertar configuración de turnos por defecto
      const defaultTurnos = [
        {
          turno: 'DESAYUNO',
          hora_inicio: '06:00:00',
          hora_fin: '10:00:00',
          activo: true,
          descripcion: 'Desayuno empresarial'
        },
        {
          turno: 'ALMUERZO',
          hora_inicio: '11:30:00', 
          hora_fin: '16:30:00',
          activo: true,
          descripcion: 'Almuerzo empresarial'
        },
        {
          turno: 'CENA',
          hora_inicio: '20:00:00',
          hora_fin: '22:00:00', 
          activo: true,
          descripcion: 'Cena empresarial'
        }
      ]

      await supabaseAdmin
        .from('turnos_config')
        .upsert(defaultTurnos, { onConflict: 'turno' })
    }

    return NextResponse.json({
      success: true,
      message: 'Sistema inicializado correctamente',
      data: {
        admin_created: userData?.[0] || 'already_exists',
        test_users: testData?.length || 0,
        turnos_configured: true
      }
    })

  } catch (error) {
    console.error('Error en setup:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error inicializando sistema'
    }, { status: 500 })
  }
}