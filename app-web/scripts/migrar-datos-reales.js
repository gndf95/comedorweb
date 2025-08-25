/**
 * Script para migrar datos reales desde SQLite a Supabase
 * Busca y migra datos desde el sistema Python original
 */

const Database = require('sqlite3').Database;
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = 'https://unigberekthjkrgmjxjs.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaWdiZXJla3RoamtyZ21qeGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0NDExMiwiZXhwIjoyMDcxNzIwMTEyfQ.mLDqZeWET2Lhc2udN4TEtVJfdlusnYA2ZdgjWKVhO-o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Posibles ubicaciones de la base de datos SQLite original
const possibleSqlitePaths = [
  '../referencia/comedor.db',
  '../referencia/src/data/comedor.db', 
  '../referencia/database.db',
  '../comedor.db',
  '../../comedor.db',
  '../referencia/sistema_comedor.db'
];

async function encontrarBaseDatos() {
  console.log('🔍 Buscando base de datos SQLite original...');
  
  for (const dbPath of possibleSqlitePaths) {
    const fullPath = path.resolve(__dirname, dbPath);
    console.log(`   Verificando: ${fullPath}`);
    
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Base de datos encontrada: ${fullPath}`);
      return fullPath;
    }
  }
  
  console.log('❌ No se encontró la base de datos SQLite original');
  return null;
}

async function analizarEstructuraSQLite(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('📊 Analizando estructura de la base de datos...');
      
      // Obtener lista de tablas
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`   Tablas encontradas: ${tables.map(t => t.name).join(', ')}`);
        
        const promises = tables.map(table => {
          return new Promise((res, rej) => {
            db.all(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
              if (err) rej(err);
              else {
                console.log(`   ${table.name}: ${result[0].count} registros`);
                res({ tabla: table.name, registros: result[0].count });
              }
            });
          });
        });
        
        Promise.all(promises).then(resultados => {
          db.close();
          resolve({ tablas: tables.map(t => t.name), estadisticas: resultados });
        });
      });
    });
  });
}

async function migrarUsuarios(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath);
    
    // Primero verificar estructura de la tabla usuarios
    db.all("PRAGMA table_info(usuarios)", (err, columns) => {
      if (err) {
        console.log('⚠️  Tabla usuarios no encontrada en SQLite');
        resolve([]);
        return;
      }
      
      console.log('👥 Migrando usuarios...');
      console.log('   Columnas disponibles:', columns.map(c => c.name).join(', '));
      
      db.all("SELECT * FROM usuarios", async (err, usuarios) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`   Procesando ${usuarios.length} usuarios...`);
        
        const usuariosTransformados = usuarios.map(u => ({
          codigo: u.codigo || u.id?.toString().padStart(4, '0'),
          nombre: u.nombre || `USUARIO ${u.id}`,
          tipo: (u.tipo === 'empleado' || u.tipo === 'EMPLEADO') ? 'EMPLEADO' : 'EXTERNO',
          activo: u.activo !== false,
          email: u.email || null,
          telefono: u.telefono || null,
          departamento: u.departamento || u.area || null,
          notas: u.observaciones || u.notas || null
        }));
        
        // Insertar en Supabase (con upsert para evitar duplicados)
        const { data, error } = await supabase
          .from('usuarios')
          .upsert(usuariosTransformados, { 
            onConflict: 'codigo',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error('❌ Error migrando usuarios:', error.message);
          reject(error);
        } else {
          console.log(`✅ ${usuariosTransformados.length} usuarios migrados exitosamente`);
          resolve(usuariosTransformados);
        }
        
        db.close();
      });
    });
  });
}

async function migrarRegistros(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath);
    
    // Verificar si existe tabla de registros (posibles nombres)
    const posiblesTablas = ['registros', 'escaneos', 'entradas', 'log_acceso'];
    
    let tablaEncontrada = null;
    let contador = 0;
    
    const verificarTabla = (nombreTabla) => {
      db.all(`PRAGMA table_info(${nombreTabla})`, (err, columns) => {
        contador++;
        
        if (!err && columns.length > 0) {
          tablaEncontrada = nombreTabla;
          console.log(`📋 Tabla de registros encontrada: ${nombreTabla}`);
          migrarDesdeTabla(nombreTabla);
        } else if (contador >= posiblesTablas.length && !tablaEncontrada) {
          console.log('⚠️  No se encontraron tablas de registros en SQLite');
          resolve([]);
        }
      });
    };
    
    posiblesTablas.forEach(verificarTabla);
    
    async function migrarDesdeTabla(nombreTabla) {
      db.all(`SELECT * FROM ${nombreTabla} ORDER BY fecha DESC, hora DESC LIMIT 1000`, async (err, registros) => {
        if (err) {
          console.error('❌ Error leyendo registros:', err);
          reject(err);
          return;
        }
        
        console.log(`   Procesando ${registros.length} registros...`);
        
        const registrosTransformados = registros.map(r => ({
          // Buscar usuario_id correspondiente al código
          codigo: r.codigo || r.usuario_codigo,
          fecha: r.fecha || new Date().toISOString().split('T')[0],
          hora: r.hora || new Date().toTimeString().split(' ')[0],
          turno: r.turno || determinarTurno(r.hora),
          nombre: r.nombre || r.usuario_nombre || 'USUARIO DESCONOCIDO',
          tipo: r.tipo || 'EMPLEADO',
          dispositivo: r.dispositivo || 'MIGRADO_SQLITE',
          metodo_entrada: r.metodo || 'CODIGO',
          timestamp_completo: r.timestamp || `${r.fecha || new Date().toISOString().split('T')[0]}T${r.hora || '12:00:00'}.000Z`
        }));
        
        // Filtrar registros válidos
        const registrosValidos = registrosTransformados.filter(r => r.codigo && r.fecha);
        
        if (registrosValidos.length > 0) {
          console.log(`   Insertando ${registrosValidos.length} registros válidos...`);
          
          // Insertar en lotes pequeños para evitar errores
          const batchSize = 50;
          let insertados = 0;
          
          for (let i = 0; i < registrosValidos.length; i += batchSize) {
            const batch = registrosValidos.slice(i, i + batchSize);
            
            const { error } = await supabase
              .from('registros_comedor')
              .insert(batch);
            
            if (error) {
              console.warn(`⚠️  Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
            } else {
              insertados += batch.length;
            }
          }
          
          console.log(`✅ ${insertados} registros migrados exitosamente`);
        }
        
        resolve(registrosTransformados);
        db.close();
      });
    }
  });
}

function determinarTurno(hora) {
  if (!hora) return 'COMIDA';
  
  const h = parseInt(hora.split(':')[0]);
  
  if (h >= 6 && h < 10) return 'DESAYUNO';
  if (h >= 11 && h < 17) return 'COMIDA';
  if (h >= 20 && h < 23) return 'CENA';
  
  return 'COMIDA';
}

async function ejecutarMigracion() {
  try {
    console.log('🚀 Iniciando migración de datos reales...\n');
    
    const dbPath = await encontrarBaseDatos();
    
    if (!dbPath) {
      console.log('');
      console.log('💡 OPCIONES:');
      console.log('   1. Copia la base de datos SQLite a una de estas ubicaciones:');
      possibleSqlitePaths.forEach(p => console.log(`      - ${path.resolve(__dirname, p)}`));
      console.log('   2. O indica la ruta correcta modificando el script');
      console.log('   3. O continúa con datos de prueba (ya tienes algunos cargados)');
      return;
    }
    
    console.log('');
    const estructura = await analizarEstructuraSQLite(dbPath);
    console.log('');
    
    // Migrar usuarios
    await migrarUsuarios(dbPath);
    console.log('');
    
    // Migrar registros
    await migrarRegistros(dbPath);
    console.log('');
    
    console.log('🎉 Migración completada exitosamente!');
    console.log('');
    console.log('🔍 Verifica los datos en:');
    console.log('   - Dashboard Supabase: https://app.supabase.com/project/unigberekthjkrgmjxjs');
    console.log('   - API local: http://localhost:3001/api/verificar-datos');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarMigracion();
}

module.exports = { ejecutarMigracion, encontrarBaseDatos };