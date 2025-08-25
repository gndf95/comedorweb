/**
 * Configuración de variables de entorno con validación
 * Centraliza todas las variables de entorno del sistema
 */

import { z } from 'zod'

// Schema de validación para variables de entorno
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  
  // Next.js
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Sistema de Comedor
  NEXT_PUBLIC_MODO_KIOSCO: z.string().transform((val) => val === 'true'),
  NEXT_PUBLIC_AUTO_FULLSCREEN: z.string().transform((val) => val === 'true'),
  NEXT_PUBLIC_REFRESH_INTERVAL_MS: z.string().transform((val) => parseInt(val, 10)),
  
  // Turnos (formato HH:MM)
  NEXT_PUBLIC_DESAYUNO_INICIO: z.string().regex(/^\d{2}:\d{2}$/),
  NEXT_PUBLIC_DESAYUNO_FIN: z.string().regex(/^\d{2}:\d{2}$/),
  NEXT_PUBLIC_COMIDA_INICIO: z.string().regex(/^\d{2}:\d{2}$/),
  NEXT_PUBLIC_COMIDA_FIN: z.string().regex(/^\d{2}:\d{2}$/),
  NEXT_PUBLIC_CENA_INICIO: z.string().regex(/^\d{2}:\d{2}$/),
  NEXT_PUBLIC_CENA_FIN: z.string().regex(/^\d{2}:\d{2}$/),
  
  // PWA
  NEXT_PUBLIC_PWA_NAME: z.string().min(1),
  NEXT_PUBLIC_PWA_SHORT_NAME: z.string().min(1),
  NEXT_PUBLIC_PWA_DESCRIPTION: z.string().min(1),
  
  // Features Flags
  NEXT_PUBLIC_ENABLE_CAMERA_SCANNER: z.string().transform((val) => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: z.string().transform((val) => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_OFFLINE_MODE: z.string().transform((val) => val === 'true').optional(),
  
  // Development
  NEXT_PUBLIC_DEBUG_MODE: z.string().transform((val) => val === 'true').optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
})

// Validar variables de entorno
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:')
    console.error(error)
    throw new Error('Invalid environment variables')
  }
}

// Exportar configuración validada
export const env = validateEnv()

// Tipos TypeScript para autocompletado
export type Env = z.infer<typeof envSchema>

// Configuración de turnos procesada
export const turnosConfig = {
  DESAYUNO: {
    inicio: env.NEXT_PUBLIC_DESAYUNO_INICIO,
    fin: env.NEXT_PUBLIC_DESAYUNO_FIN,
    nombre: 'Desayuno'
  },
  COMIDA: {
    inicio: env.NEXT_PUBLIC_COMIDA_INICIO,
    fin: env.NEXT_PUBLIC_COMIDA_FIN,
    nombre: 'Comida'
  },
  CENA: {
    inicio: env.NEXT_PUBLIC_CENA_INICIO,
    fin: env.NEXT_PUBLIC_CENA_FIN,
    nombre: 'Cena'
  }
} as const

// Configuración de la aplicación
export const appConfig = {
  name: env.NEXT_PUBLIC_PWA_NAME,
  shortName: env.NEXT_PUBLIC_PWA_SHORT_NAME,
  description: env.NEXT_PUBLIC_PWA_DESCRIPTION,
  url: env.NEXT_PUBLIC_APP_URL,
  modoKiosco: env.NEXT_PUBLIC_MODO_KIOSCO,
  autoFullscreen: env.NEXT_PUBLIC_AUTO_FULLSCREEN,
  refreshInterval: env.NEXT_PUBLIC_REFRESH_INTERVAL_MS,
} as const

// Features flags
export const features = {
  cameraScanner: env.NEXT_PUBLIC_ENABLE_CAMERA_SCANNER ?? false,
  pushNotifications: env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS ?? false,
  offlineMode: env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE ?? true,
  debugMode: env.NEXT_PUBLIC_DEBUG_MODE ?? false,
} as const

// Helper para verificar entorno
export const isDev = env.NODE_ENV === 'development'
export const isProd = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'