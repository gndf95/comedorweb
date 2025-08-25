# 🚀 Guía de Configuración - Sistema de Comedor Web

## 📋 Requisitos Previos

- **Node.js**: ≥ 18.0.0
- **npm**: ≥ 9.0.0
- **Cuenta Supabase**: Crear en [supabase.com](https://supabase.com)
- **Git**: Para control de versiones

## 🔧 Instalación Paso a Paso

### 1. Instalar Dependencias

```bash
cd app-web
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con tus valores reales
nano .env.local
```

**Variables críticas a configurar:**

```env
# Supabase (obtener de tu proyecto en app.supabase.io)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
DATABASE_URL=postgresql://postgres:password@db.tu-proyecto.supabase.co:5432/postgres

# Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-muy-seguro
```

### 3. Configurar Supabase

#### 3.1 Crear Proyecto Supabase

1. Ve a [app.supabase.io](https://app.supabase.io)
2. Crear nuevo proyecto
3. Copiar URL y keys a `.env.local`

#### 3.2 Configurar Base de Datos

```bash
# Instalar CLI de Supabase
npm install -g supabase

# Inicializar en el proyecto
supabase init

# Conectar con tu proyecto remoto
supabase link --project-ref tu-project-id

# Aplicar migraciones
supabase db push
```

#### 3.3 Ejecutar Migraciones SQL

Copiar y ejecutar el esquema PostgreSQL completo en el SQL Editor de Supabase:

```sql
-- (Copiar todo el contenido del esquema PostgreSQL diseñado anteriormente)
```

### 4. Generar Tipos TypeScript

```bash
# Generar tipos desde la base de datos
npm run db:generate
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

## 🗄️ Migración de Datos del Sistema Python

### Script de Migración

```bash
# Ejecutar script de migración de SQLite a PostgreSQL
npm run migrate
```

Este script:
- ✅ Lee la base de datos SQLite actual (`referencia/data/comedor.db`)
- ✅ Migra todos los empleados (170+)
- ✅ Migra historial de registros
- ✅ Convierte formatos de datos
- ✅ Valida integridad

### Verificar Migración

```bash
# En Supabase, ejecutar queries de verificación:
SELECT COUNT(*) FROM usuarios WHERE tipo = 'EMPLEADO';
SELECT COUNT(*) FROM usuarios WHERE tipo = 'EXTERNO';
SELECT COUNT(*) FROM registros_comedor;
```

## 🌐 Deployment en Vercel

### 1. Conectar Repositorio

```bash
# Inicializar Git (si no está)
git init
git add .
git commit -m "Initial commit: Sistema Comedor Web"

# Conectar con GitHub/GitLab
git remote add origin tu-repositorio-url
git push -u origin main
```

### 2. Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Importar proyecto desde Git
3. Configurar variables de entorno (copiar desde `.env.local`)
4. Deploy

### 3. Configurar Dominio Personalizado (Opcional)

En el dashboard de Vercel:
- Settings → Domains
- Agregar dominio personalizado

## ⚙️ Configuración de PWA

### 1. Generar Iconos

Crear iconos para PWA en `/public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- Otros tamaños según `manifest.json`

### 2. Configurar Service Worker

El service worker básico ya está configurado en `/public/sw.js`

### 3. Probar PWA

1. Abrir en Chrome/Edge
2. F12 → Application → Manifest
3. Verificar que se puede "Instalar"

## 🔧 Configuración Específica del Sistema

### Lector USB de Códigos de Barras

El sistema está configurado para trabajar con lectores USB que actúan como teclado:

```typescript
// El input invisible capturará automáticamente los códigos
// No requiere configuración adicional de hardware
```

### Horarios de Turnos

Configurar en `.env.local`:

```env
NEXT_PUBLIC_DESAYUNO_INICIO=06:00
NEXT_PUBLIC_DESAYUNO_FIN=10:00
NEXT_PUBLIC_COMIDA_INICIO=11:30
NEXT_PUBLIC_COMIDA_FIN=16:30
NEXT_PUBLIC_CENA_INICIO=20:00
NEXT_PUBLIC_CENA_FIN=22:00
```

### Modo Kiosco

Para habilitar/deshabilitar modo kiosco:

```env
NEXT_PUBLIC_MODO_KIOSCO=true
NEXT_PUBLIC_AUTO_FULLSCREEN=true
```

## 🐛 Troubleshooting

### Error: "Cannot connect to Supabase"

1. Verificar URLs y keys en `.env.local`
2. Verificar que el proyecto Supabase está activo
3. Comprobar firewall/proxy

### Error: "Database schema not found"

```bash
# Resetear y aplicar migraciones
supabase db reset
supabase db push
```

### Error: "Type generation failed"

```bash
# Verificar conexión y regenerar
npm run db:generate
```

### PWA no se instala

1. Verificar HTTPS (requerido para PWA)
2. Validar `manifest.json`
3. Comprobar service worker

## 📊 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor desarrollo
npm run build           # Build producción
npm run start           # Servidor producción
npm run lint            # ESLint
npm run type-check      # TypeScript check

# Base de datos
npm run db:generate     # Generar tipos
npm run db:reset        # Reset DB
npm run db:push         # Push migraciones
npm run migrate         # Migrar datos SQLite

# Utilidades
npm run format          # Prettier
```

## 🔐 Consideraciones de Seguridad

1. **Variables de entorno**: Nunca commitear `.env.local`
2. **Service Role Key**: Solo usar en servidor
3. **RLS**: Configurar políticas de seguridad en Supabase
4. **HTTPS**: Requerido en producción para PWA

## 📞 Soporte

Para problemas técnicos:

1. Revisar logs en consola del navegador
2. Verificar logs de Vercel
3. Comprobar logs de Supabase
4. Documentar error y contexto

---

**✅ Una vez completados todos los pasos, el sistema estará listo para producción.**