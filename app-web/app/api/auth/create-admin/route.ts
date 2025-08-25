import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Crear usuario administrador por defecto
    const { data: user, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@sistema-comedor.local',
      password: 'admin123',
      email_confirm: true, // ✅ Confirmar email automáticamente
      user_metadata: {
        role: 'admin',
        nombre: 'Administrador',
        apellidos: 'Sistema'
      }
    })

    if (signUpError) {
      console.error('Error creando usuario admin:', signUpError)
      return NextResponse.json({ 
        error: signUpError.message,
        success: false 
      }, { status: 400 })
    }

    // También crear entrada en la tabla usuarios
    if (user.user) {
      const { error: dbError } = await supabaseAdmin
        .from('usuarios')
        .upsert([{
          id: user.user.id,
          codigo: 'ADMIN001',
          nombre: 'Administrador',
          apellidos: 'Sistema',
          email: 'admin@sistema-comedor.local',
          tipo_usuario: 'admin',
          activo: true,
          fecha_registro: new Date().toISOString()
        }])

      if (dbError) {
        console.error('Error creando registro en usuarios:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      credentials: {
        email: 'admin@sistema-comedor.local',
        password: 'admin123'
      }
    })
  } catch (error) {
    console.error('Error creando administrador:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      success: false 
    }, { status: 500 })
  }
}