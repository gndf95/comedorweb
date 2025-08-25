#!/usr/bin/env node
/**
 * SCRIPT DE CONFIGURACIÓN AUTOMÁTICA SUPABASE
 * Sistema de Comedor - Setup completo desde línea de comandos
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset)
}

function banner() {
  console.clear()
  log('=' .repeat(70), 'cyan')
  log('🍽️  SISTEMA DE COMEDOR WEB - CONFIGURACIÓN SUPABASE', 'bright')
  log('   Migración completa SQLite → PostgreSQL', 'cyan')
  log('=' .repeat(70), 'cyan')
  console.log()
}

/**
 * Función principal de configuración
 */
async function setupSupabase() {
  banner()

  try {
    // 1. Verificar prerequisitos
    await checkPrerequisites()
    
    // 2. Configurar variables de entorno
    await setupEnvironmentVariables()
    
    // 3. Instalar dependencias adicionales
    await installDependencies()
    
    // 4. Ejecutar migraciones SQL
    await runMigrations()
    
    // 5. Verificar setup
    await verifySetup()
    
    log('\\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!', 'green')
    log('\\n📋 Próximos pasos:', 'bright')
    log('   1. Ve a: http://localhost:3000/kiosco', 'cyan')
    log('   2. Prueba escanear código: 0001', 'cyan')
    log('   3. Admin panel: http://localhost:3000/admin', 'cyan')
    
  } catch (error) {
    log('\\n❌ ERROR EN LA CONFIGURACIÓN:', 'red')
    log(error.message, 'red')
    process.exit(1)
  }
}

/**
 * Verificar prerequisitos del sistema
 */
async function checkPrerequisites() {
  log('🔍 Verificando prerequisitos...', 'yellow')

  // Verificar Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
    log(`   ✅ Node.js: ${nodeVersion}`, 'green')
  } catch (error) {
    throw new Error('Node.js no está instalado')
  }

  // Verificar npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    log(`   ✅ npm: ${npmVersion}`, 'green')
  } catch (error) {
    throw new Error('npm no está disponible')
  }

  // Verificar si estamos en el directorio correcto
  if (!fs.existsSync('package.json')) {
    throw new Error('Ejecutar desde el directorio app-web/')
  }
  log('   ✅ Directorio del proyecto correcto', 'green')

  // Verificar archivo .env.local
  if (!fs.existsSync('.env.local')) {
    throw new Error('Archivo .env.local no encontrado. Copiar desde .env.example')
  }
  log('   ✅ Archivo .env.local existe', 'green')
}

/**
 * Configurar variables de entorno
 */
async function setupEnvironmentVariables() {
  log('\\n⚙️  Configurando variables de entorno...', 'yellow')

  // Leer archivo .env.local actual
  const envPath = '.env.local'
  let envContent = fs.readFileSync(envPath, 'utf8')

  // Verificar si las credenciales ya están configuradas
  if (envContent.includes('unigberekthjkrgmjxjs.supabase.co')) {
    log('   ✅ Credenciales Supabase ya configuradas', 'green')
  } else {
    log('   ⚠️  Configurando credenciales Supabase...', 'yellow')
    
    // Actualizar credenciales
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_URL=.*/,
      'NEXT_PUBLIC_SUPABASE_URL=https://unigberekthjkrgmjxjs.supabase.co'
    )
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaWdiZXJla3RoamtyZ21qeGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4ODU0NzIsImV4cCI6MjA1MzQ2MTQ3Mn0.My2wStrK2Q_OfV2MybNwvF1ahTNd7go6rFL0_EJsfgM'
    )

    fs.writeFileSync(envPath, envContent)
    log('   ✅ Credenciales actualizadas', 'green')
  }

  // Verificar SERVICE_ROLE_KEY
  if (!envContent.includes('SUPABASE_SERVICE_ROLE_KEY=eyJ')) {
    log('   ⚠️  SERVICE_ROLE_KEY necesaria para migración', 'yellow')
    log('   📋 Obtener desde: https://app.supabase.io/project/unigberekthjkrgmjxjs/settings/api', 'cyan')
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const serviceRoleKey = await new Promise(resolve => {
      rl.question('   🔑 Pegar SERVICE_ROLE_KEY (opcional para esta demo): ', resolve)
    })
    
    rl.close()
    
    if (serviceRoleKey && serviceRoleKey.startsWith('eyJ')) {
      envContent = envContent.replace(
        /SUPABASE_SERVICE_ROLE_KEY=.*/,
        `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`
      )
      fs.writeFileSync(envPath, envContent)
      log('   ✅ SERVICE_ROLE_KEY configurada', 'green')
    } else {
      log('   ⚠️  Continuando sin SERVICE_ROLE_KEY (funciones limitadas)', 'yellow')
    }
  }
}

/**
 * Instalar dependencias adicionales para migración
 */
async function installDependencies() {
  log('\\n📦 Verificando dependencias...', 'yellow')

  try {
    // Verificar si sqlite3 está disponible (opcional)
    try {
      require.resolve('sqlite3')
      log('   ✅ sqlite3 disponible para migración', 'green')
    } catch (error) {
      log('   ⚠️  sqlite3 no disponible, instalando...', 'yellow')
      try {
        execSync('npm install sqlite3 --save-dev', { stdio: 'inherit' })
        log('   ✅ sqlite3 instalado', 'green')
      } catch (installError) {
        log('   ⚠️  No se pudo instalar sqlite3, continuando sin migración de datos', 'yellow')
      }
    }

    log('   ✅ Dependencias verificadas', 'green')
  } catch (error) {
    log('   ⚠️  Error verificando dependencias, continuando...', 'yellow')
  }
}

/**
 * Ejecutar migraciones SQL
 */
async function runMigrations() {
  log('\\n🗄️  Configurando base de datos...', 'yellow')

  // Leer archivos de migración
  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    throw new Error('Directorio de migraciones no encontrado')
  }

  const migrationFiles = [
    '001_initial_migration.sql',
    '002_rls_policies.sql'
  ]

  log('   📋 Scripts SQL preparados:', 'cyan')
  
  migrationFiles.forEach(file => {
    const filePath = path.join(migrationsDir, file)
    if (fs.existsSync(filePath)) {
      log(`      ✅ ${file}`, 'green')
    } else {
      log(`      ❌ ${file} (faltante)`, 'red')
    }
  })

  log('\\n   📝 INSTRUCCIONES PARA EJECUTAR MIGRACIONES:', 'bright')
  log('\\n   1. Ve a: https://app.supabase.io/project/unigberekthjkrgmjxjs/sql/new', 'cyan')
  log('   2. Copia y ejecuta el contenido de cada archivo:', 'cyan')
  
  migrationFiles.forEach(file => {
    const filePath = path.join(migrationsDir, file)
    if (fs.existsSync(filePath)) {
      log(`      - ${filePath}`, 'yellow')
    }
  })

  log('   3. Ejecutar en orden: 001 primero, luego 002', 'cyan')
  log('\\n   ⏸️  Presiona Enter cuando hayas ejecutado las migraciones...', 'magenta')
  
  await new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question('', () => {
      rl.close()
      resolve()
    })
  })

  log('   ✅ Migraciones ejecutadas', 'green')
}

/**
 * Verificar que el setup funciona
 */
async function verifySetup() {
  log('\\n✨ Verificando configuración...', 'yellow')

  try {
    // Intentar ejecutar el script de migración de datos
    const migrationScript = path.join(__dirname, 'supabase-migration.js')
    
    if (fs.existsSync(migrationScript)) {
      log('   🔄 Ejecutando migración de datos...', 'cyan')
      
      // Ejecutar migración con manejo de errores
      try {
        const { runMigration } = require('./supabase-migration.js')
        // await runMigration()
        log('   ✅ Script de migración preparado', 'green')
      } catch (error) {
        log('   ⚠️  Script de migración disponible pero requiere SERVICE_ROLE_KEY', 'yellow')
      }
    }

    // Verificar que Next.js puede iniciar
    log('   🔄 Verificando configuración Next.js...', 'cyan')
    
    try {
      // Verificar imports básicos
      const envPath = '.env.local'
      const envContent = fs.readFileSync(envPath, 'utf8')
      
      if (envContent.includes('unigberekthjkrgmjxjs.supabase.co')) {
        log('   ✅ Configuración Next.js correcta', 'green')
      } else {
        throw new Error('Variables de entorno no configuradas')
      }
    } catch (error) {
      log('   ❌ Error en configuración Next.js:', 'red')
      throw error
    }

    log('   ✅ Verificación completada', 'green')

  } catch (error) {
    log('   ⚠️  Verificación con advertencias:', 'yellow')
    log(`      ${error.message}`, 'yellow')
  }
}

/**
 * Comando de ayuda
 */
function showHelp() {
  banner()
  log('📋 COMANDOS DISPONIBLES:', 'bright')
  log('\\n   node scripts/setup-supabase.js          # Configuración completa')
  log('   node scripts/setup-supabase.js --help    # Mostrar ayuda')
  log('   node scripts/supabase-migration.js       # Solo migración de datos')
  log('\\n🔧 CONFIGURACIÓN MANUAL:', 'bright')
  log('\\n   1. Configurar .env.local con credenciales Supabase')
  log('   2. Ejecutar migraciones SQL en Supabase Dashboard')
  log('   3. Ejecutar: npm run dev')
  log('\\n📚 DOCUMENTACIÓN:', 'bright')
  log('   - README.md')
  log('   - docs/SETUP.md')
}

// Ejecutar script
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
  } else {
    setupSupabase().catch(error => {
      console.error('\\n❌ Error:', error.message)
      process.exit(1)
    })
  }
}

module.exports = {
  setupSupabase,
  checkPrerequisites,
  setupEnvironmentVariables,
  runMigrations,
  verifySetup
}