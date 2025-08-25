import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utilidades para el sistema de comedor
 */

// Formatear códigos de empleado (0001, 0234, etc.)
export function formatEmpleadoCodigo(codigo: string | number): string {
  const num = typeof codigo === 'string' ? parseInt(codigo) : codigo
  return num.toString().padStart(4, '0')
}

// Validar formato de código de empleado
export function isValidEmpleadoCodigo(codigo: string): boolean {
  return /^\d{4}$/.test(codigo)
}

// Validar formato de código externo (EXT001, EXT025, etc.)
export function isValidExternoCodigo(codigo: string): boolean {
  return /^EXT\d{3}$/.test(codigo)
}

// Formatear fecha para mostrar
export function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Formatear hora para mostrar
export function formatHora(fecha: Date): string {
  return fecha.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formatear fecha y hora completa
export function formatFechaHora(fecha: Date): string {
  return fecha.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obtener turno basado en hora actual
export function obtenerTurnoActual(): { turno: string; nombre: string; activo: boolean } {
  const ahora = new Date()
  const hora = ahora.getHours()
  const minutos = ahora.getMinutes()
  const horaActual = hora + (minutos / 60)

  // DESAYUNO: 06:00 - 10:00
  if (horaActual >= 6 && horaActual <= 10) {
    return { turno: 'DESAYUNO', nombre: 'Desayuno', activo: true }
  }
  
  // COMIDA: 11:30 - 16:30
  if (horaActual >= 11.5 && horaActual <= 16.5) {
    return { turno: 'COMIDA', nombre: 'Comida', activo: true }
  }
  
  // CENA: 20:00 - 22:00
  if (horaActual >= 20 && horaActual <= 22) {
    return { turno: 'CENA', nombre: 'Cena', activo: true }
  }

  // Fuera de horario - determinar próximo turno
  if (horaActual < 6) {
    return { turno: 'DESAYUNO', nombre: 'Próximo: Desayuno a las 06:00', activo: false }
  } else if (horaActual > 10 && horaActual < 11.5) {
    return { turno: 'COMIDA', nombre: 'Próximo: Comida a las 11:30', activo: false }
  } else if (horaActual > 16.5 && horaActual < 20) {
    return { turno: 'CENA', nombre: 'Próximo: Cena a las 20:00', activo: false }
  } else {
    return { turno: 'DESAYUNO', nombre: 'Próximo: Desayuno mañana a las 06:00', activo: false }
  }
}

// Validar si está en horario de comedor
export function estaEnHorarioComedor(): boolean {
  const { activo } = obtenerTurnoActual()
  return activo
}

// Debounce function para inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Sleep function para delays
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Generar ID único
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Formatear números para estadísticas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-MX').format(num)
}

// Calcular porcentaje
export function calcularPorcentaje(parte: number, total: number): number {
  if (total === 0) return 0
  return Math.round((parte / total) * 100)
}

// Manejar errores de forma consistente
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Ha ocurrido un error desconocido'
}