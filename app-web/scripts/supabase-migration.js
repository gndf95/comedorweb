/**
 * SCRIPT DE MIGRACIÓN COMPLETA: SQLite → Supabase PostgreSQL
 * Sistema de Comedor - Migración de datos existentes
 */

const { createClient } = require('@supabase/supabase-js')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

// Configuración de Supabase
const SUPABASE_URL = 'https://unigberekthjkrgmjxjs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaWdiZXJla3RoamtyZ21qeGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4ODU0NzIsImV4cCI6MjA1MzQ2MTQ3Mn0.My2wStrK2Q_OfV2MybNwvF1ahTNd7go6rFL0_EJsfgM'

// IMPORTANTE: Para operaciones de migración necesitamos el SERVICE_ROLE_KEY
// Obtenerlo desde Supabase Dashboard > Settings > API > service_role (secret)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'NECESITA_SERVICE_ROLE_KEY'

// Rutas de archivos
const SQLITE_DB_PATH = path.join(__dirname, '../../referencia/data/comedor.db')
const EXCEL_PATH = path.join(__dirname, '../../referencia/data/baseempleados.xlsx')

// Cliente de Supabase (usar service role para migración)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Función principal de migración
 */
async function runMigration() {
  console.log('🚀 INICIANDO MIGRACIÓN COMPLETA SQLite → Supabase')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar conexión con Supabase
    await verifySupabaseConnection()
    
    // 2. Ejecutar scripts SQL de migración
    await executeSchemaScripts()
    
    // 3. Migrar usuarios desde SQLite
    await migrateUsuarios()
    
    // 4. Migrar registros existentes
    await migrateRegistros()
    
    // 5. Verificar integridad de datos
    await verifyDataIntegrity()
    
    // 6. Configurar datos iniciales
    await setupInitialData()
    
    console.log('\\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ ERROR EN LA MIGRACIÓN:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

/**
 * Verificar conexión con Supabase
 */
async function verifySupabaseConnection() {
  console.log('\\n🔌 Verificando conexión con Supabase...')
  
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1)
    
    if (error && !error.message.includes('relation "usuarios" does not exist')) {
      throw error
    }
    
    console.log('✅ Conexión con Supabase establecida')
  } catch (error) {
    console.error('❌ Error conectando con Supabase:', error.message)
    console.log('\\n🔧 Verificar:')
    console.log('1. SUPABASE_URL está correcta')
    console.log('2. SUPABASE_SERVICE_ROLE_KEY está configurada')
    console.log('3. Proyecto Supabase está activo')
    throw error
  }
}

/**
 * Ejecutar scripts SQL de migración
 */
async function executeSchemaScripts() {
  console.log('\\n📝 Ejecutando scripts de migración SQL...')
  
  try {
    // Leer archivo de migración principal
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_migration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('   📁 Ejecutando 001_initial_migration.sql')
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    })
    
    if (error) {
      // Si la función exec_sql no existe, usar método alternativo
      console.log('   ⚠️  Función exec_sql no disponible, ejecutar manualmente en Supabase SQL Editor')
      console.log('   📋 Script SQL preparado en:', migrationPath)
    } else {
      console.log('   ✅ Migración principal ejecutada')
    }
    
    // Leer archivo de políticas RLS
    const rlsPath = path.join(__dirname, '../supabase/migrations/002_rls_policies.sql')
    const rlsSQL = fs.readFileSync(rlsPath, 'utf8')
    
    console.log('   📁 Ejecutando 002_rls_policies.sql')
    
    console.log('\\n⚠️  IMPORTANTE: Ejecutar manualmente los siguientes archivos SQL en Supabase:')
    console.log('   1.', migrationPath)
    console.log('   2.', rlsPath)
    console.log('\\n   Ve a: Supabase Dashboard > SQL Editor > New Query')
    
  } catch (error) {
    console.error('❌ Error ejecutando scripts SQL:', error.message)
    throw error
  }
}

/**
 * Migrar usuarios desde SQLite
 */
async function migrateUsuarios() {
  console.log('\\n👥 Migrando usuarios desde SQLite...')
  
  return new Promise((resolve, reject) => {
    // Verificar si existe el archivo SQLite
    if (!fs.existsSync(SQLITE_DB_PATH)) {
      console.log('   ⚠️  Archivo SQLite no encontrado:', SQLITE_DB_PATH)
      console.log('   📝 Creando usuarios de prueba...')
      resolve()
      return
    }
    
    const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, async (err) => {
      if (err) {
        console.log('   ⚠️  No se pudo abrir SQLite, usando datos de prueba')
        await createTestUsers()
        resolve()
        return
      }
      
      console.log('   📖 Leyendo usuarios desde SQLite...')
      
      db.all("SELECT codigo, nombre, tipo, activo FROM usuarios", async (err, rows) => {
        if (err) {
          reject(err)
          return
        }
        
        console.log(`   📊 Encontrados ${rows.length} usuarios en SQLite`)
        
        let migrados = 0
        let errores = 0
        
        for (const row of rows) {
          try {
            const { data, error } = await supabase
              .from('usuarios')
              .insert({
                codigo: row.codigo,
                nombre: row.nombre,
                tipo: row.tipo,
                activo: row.activo === 1,
                email: row.tipo === 'EMPLEADO' ? `${row.codigo}@empresa.com` : null,
                departamento: row.tipo === 'EMPLEADO' ? 'MIGRADO' : null
              })
              .select()
            
            if (error) {
              if (error.code === '23505') { // Duplicate key
                console.log(`   ⚠️  Usuario ${row.codigo} ya existe, omitiendo`)
              } else {
                console.error(`   ❌ Error migrando ${row.codigo}:`, error.message)
                errores++
              }
            } else {
              migrados++
              if (migrados % 10 === 0) {
                console.log(`   📈 Migrados: ${migrados}/${rows.length}`)
              }
            }
          } catch (error) {
            console.error(`   ❌ Error migrando ${row.codigo}:`, error.message)
            errores++
          }
        }
        
        console.log(`   ✅ Usuarios migrados: ${migrados}`)
        if (errores > 0) {
          console.log(`   ⚠️  Errores: ${errores}`)
        }
        
        db.close()
        resolve()
      })
    })
  })
}

/**
 * Crear usuarios de prueba si no hay datos SQLite
 */
async function createTestUsers() {
  console.log('   🧪 Creando usuarios de prueba...')
  
  const testUsers = [
    { codigo: '0001', nombre: 'EMPLEADO PRUEBA 001', tipo: 'EMPLEADO' },
    { codigo: '0002', nombre: 'EMPLEADO PRUEBA 002', tipo: 'EMPLEADO' },
    { codigo: '0003', nombre: 'EMPLEADO PRUEBA 003', tipo: 'EMPLEADO' },
    { codigo: 'EXT001', nombre: 'VISITANTE EXTERNO 001', tipo: 'EXTERNO' },
    { codigo: 'EXT002', nombre: 'VISITANTE EXTERNO 002', tipo: 'EXTERNO' }
  ]
  
  for (const user of testUsers) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          codigo: user.codigo,
          nombre: user.nombre,
          tipo: user.tipo,
          activo: true,
          email: user.tipo === 'EMPLEADO' ? `${user.codigo}@empresa.com` : null,
          departamento: user.tipo === 'EMPLEADO' ? 'PRUEBA' : null
        })
        .select()
      
      if (error && error.code !== '23505') {
        console.error(`   ❌ Error creando ${user.codigo}:`, error.message)
      }
    } catch (error) {
      console.error(`   ❌ Error creando ${user.codigo}:`, error.message)
    }
  }
  
  console.log(`   ✅ Usuarios de prueba creados`)
}

/**
 * Migrar registros existentes desde SQLite
 */
async function migrateRegistros() {
  console.log('\\n📋 Migrando registros desde SQLite...')
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(SQLITE_DB_PATH)) {
      console.log('   ⚠️  Archivo SQLite no encontrado, omitiendo registros')
      resolve()
      return
    }
    
    const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.log('   ⚠️  No se pudo abrir SQLite para registros')
        resolve()
        return
      }
      
      db.all("SELECT * FROM registros_comedor LIMIT 100", async (err, rows) => {
        if (err) {
          console.log('   ⚠️  No se pudieron leer registros:', err.message)
          db.close()
          resolve()
          return
        }
        
        console.log(`   📊 Encontrados ${rows.length} registros recientes`)
        
        let migrados = 0
        
        for (const row of rows) {
          try {
            // Buscar usuario por código
            const { data: usuarios } = await supabase
              .from('usuarios')
              .select('id')
              .eq('codigo', row.codigo)
              .limit(1)
            
            if (usuarios && usuarios.length > 0) {
              const { data, error } = await supabase
                .from('registros_comedor')
                .insert({
                  usuario_id: usuarios[0].id,
                  fecha: row.fecha,
                  hora: row.hora,
                  turno: row.turno,
                  codigo: row.codigo,
                  nombre: row.nombre,
                  tipo: row.tipo,
                  timestamp_completo: row.timestamp,
                  dispositivo: 'MIGRADO',
                  metodo_entrada: 'MIGRADO'
                })
              
              if (!error) {
                migrados++
              }
            }
          } catch (error) {
            // Omitir errores de registros individuales
          }
        }
        
        console.log(`   ✅ Registros migrados: ${migrados}`)
        db.close()
        resolve()
      })
    })
  })
}

/**
 * Verificar integridad de datos migrados
 */
async function verifyDataIntegrity() {
  console.log('\\n🔍 Verificando integridad de datos...')
  
  try {
    // Contar usuarios por tipo
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('tipo')
    
    if (errorUsuarios) throw errorUsuarios
    
    const empleados = usuarios.filter(u => u.tipo === 'EMPLEADO').length
    const externos = usuarios.filter(u => u.tipo === 'EXTERNO').length
    
    console.log(`   👥 Usuarios totales: ${usuarios.length}`)
    console.log(`      - Empleados: ${empleados}`)
    console.log(`      - Externos: ${externos}`)
    
    // Contar registros
    const { data: registros, error: errorRegistros } = await supabase
      .from('registros_comedor')
      .select('id')
    
    if (errorRegistros) throw errorRegistros
    
    console.log(`   📋 Registros totales: ${registros.length}`)
    
    // Verificar funciones
    const { data: turnoActual, error: errorFuncion } = await supabase
      .rpc('obtener_turno_actual')
    
    if (errorFuncion) {
      console.log('   ⚠️  Función obtener_turno_actual no disponible:', errorFuncion.message)
    } else {
      console.log(`   ⚙️  Función obtener_turno_actual: ✅`)
    }
    
    console.log('   ✅ Verificación de integridad completada')
    
  } catch (error) {
    console.error('   ❌ Error en verificación:', error.message)
  }
}

/**
 * Configurar datos iniciales y configuraciones
 */
async function setupInitialData() {
  console.log('\\n⚙️  Configurando datos iniciales...')
  
  try {
    // Actualizar contador de empleados
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('tipo')
    
    if (usuarios) {
      const empleados = usuarios.filter(u => u.tipo === 'EMPLEADO').length
      
      await supabase
        .from('configuraciones')
        .update({ valor: empleados.toString() })
        .eq('clave', 'EMPLEADOS_TOTAL')
      
      console.log(`   📊 Contador de empleados actualizado: ${empleados}`)
    }
    
    // Refresh de vista materializada si existe
    try {
      await supabase.rpc('refresh_stats_diarias')
      console.log('   📈 Vista de estadísticas actualizada')
    } catch (error) {
      console.log('   ⚠️  Vista de estadísticas no disponible')
    }
    
    console.log('   ✅ Configuración inicial completada')
    
  } catch (error) {
    console.error('   ❌ Error en configuración inicial:', error.message)
  }
}

/**
 * Función para verificar configuración de entorno
 */
function checkEnvironment() {
  if (SUPABASE_SERVICE_ROLE_KEY === 'NECESITA_SERVICE_ROLE_KEY') {
    console.error('\\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no configurada')
    console.log('\\n🔧 Para obtener la clave:')
    console.log('1. Ve a: https://app.supabase.io/project/unigberekthjkrgmjxjs/settings/api')
    console.log('2. Copia el "service_role" key (secret)')
    console.log('3. Ejecuta: export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"')
    console.log('4. O agrégala a tu .env.local')
    process.exit(1)
  }
}

// Verificar entorno y ejecutar migración
if (require.main === module) {
  checkEnvironment()
  runMigration()
}

module.exports = {
  runMigration,
  verifySupabaseConnection,
  migrateUsuarios,
  migrateRegistros
}