import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre, apellidos } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email y contraseña son requeridos',
        success: false 
      }, { status: 400 })
    }

    // Crear usuario administrador con email ya confirmado
    const { data: user, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // ✅ Confirmar email automáticamente
      user_metadata: {
        role: 'admin',
        nombre: nombre || 'Administrador',
        apellidos: apellidos || 'Sistema'
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
          nombre: nombre || 'Administrador',
          apellidos: apellidos || 'Sistema',
          email: email,
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
        email: email,
        password: password
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