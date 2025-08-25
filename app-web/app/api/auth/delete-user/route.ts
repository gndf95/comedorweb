import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ 
        error: 'Email es requerido',
        success: false 
      }, { status: 400 })
    }

    // Buscar el usuario por email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const userToDelete = users?.users?.find(u => u.email === email)

    if (!userToDelete) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado',
        success: false 
      }, { status: 404 })
    }

    // Eliminar usuario de Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id)
    
    if (authError) {
      console.error('Error eliminando usuario:', authError)
      return NextResponse.json({ 
        error: authError.message,
        success: false 
      }, { status: 400 })
    }

    // Eliminar de la tabla usuarios también
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('email', email)

    if (dbError) {
      console.error('Error eliminando de usuarios:', dbError)
    }

    return NextResponse.json({
      success: true,
      message: `Usuario ${email} eliminado exitosamente`
    })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      success: false 
    }, { status: 500 })
  }
}