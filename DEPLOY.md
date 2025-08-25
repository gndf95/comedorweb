# Deploy en Vercel - Sistema de Comedor Web

## 📋 Configuración de Deploy

### 1. Configuración en Vercel

1. **Conectar repositorio:**
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Click en "New Project"
   - Importa desde GitHub: `https://github.com/gndf95/comedorweb`
   - Selecciona el directorio raíz: `app-web/`

2. **Configuración del proyecto:**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 2. Variables de Entorno Requeridas

Configurar en Vercel Dashboard → Project Settings → Environment Variables:

#### 🔧 Supabase (REQUERIDO)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.project-id.supabase.co:5432/postgres
```

#### 🌐 Aplicación
```env
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
```

#### ⏰ Configuración de Turnos
```env
NEXT_PUBLIC_DESAYUNO_INICIO=06:00
NEXT_PUBLIC_DESAYUNO_FIN=10:00
NEXT_PUBLIC_COMIDA_INICIO=11:30
NEXT_PUBLIC_COMIDA_FIN=16:30
NEXT_PUBLIC_CENA_INICIO=20:00
NEXT_PUBLIC_CENA_FIN=22:00
```

#### 🎛️ Features & PWA
```env
NEXT_PUBLIC_MODO_KIOSCO=true
NEXT_PUBLIC_AUTO_FULLSCREEN=true
NEXT_PUBLIC_REFRESH_INTERVAL_MS=30000
NEXT_PUBLIC_PWA_NAME=Sistema Comedor
NEXT_PUBLIC_PWA_SHORT_NAME=Comedor
NEXT_PUBLIC_PWA_DESCRIPTION=Sistema de gestión de comedor empresarial
NEXT_PUBLIC_ENABLE_CAMERA_SCANNER=false
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
```

#### 📊 Monitoreo (Opcional)
```env
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

### 3. Base de Datos - Supabase Setup

#### Crear proyecto en Supabase:
1. Ve a [Supabase Dashboard](https://app.supabase.co/)
2. Crea nuevo proyecto
3. Guarda las credenciales (URL y Keys)

#### Ejecutar migraciones:
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login a Supabase
supabase login

# Conectar al proyecto
supabase link --project-ref your-project-id

# Aplicar migraciones
supabase db push
```

### 4. Deploy Steps

1. **Preparar Supabase:**
   - Crear proyecto en Supabase
   - Aplicar migraciones desde `supabase/migrations/`
   - Configurar RLS policies

2. **Configurar Vercel:**
   - Importar proyecto desde GitHub
   - Configurar Root Directory: `app-web/`
   - Añadir todas las variables de entorno

3. **Deploy inicial:**
   - Vercel detectará automáticamente Next.js
   - Primera build puede tardar 2-3 minutos
   - Verificar logs de build si hay errores

### 5. Post-Deploy

#### Verificación:
- [ ] Aplicación carga correctamente
- [ ] Conexión a Supabase funciona
- [ ] PWA se instala correctamente
- [ ] APIs responden correctamente
- [ ] Dashboard tiempo real funciona

#### Setup inicial:
1. Navegar a `/setup` para crear usuario admin
2. Verificar conexión a base de datos
3. Probar funcionalidades principales

### 6. Dominios Personalizados (Opcional)

En Vercel Dashboard → Project → Settings → Domains:
- Añadir dominio personalizado
- Configurar DNS según instrucciones
- SSL se configura automáticamente

### 7. Troubleshooting

#### Build Errors Comunes:
- **TypeScript errors**: Verificar tipos en `lib/database.types.ts`
- **Missing env vars**: Verificar todas las variables en Vercel
- **API errors**: Verificar conexión a Supabase

#### Runtime Errors:
- **Database connection**: Verificar DATABASE_URL y credenciales
- **CORS issues**: Verificar NEXTAUTH_URL coincide con dominio
- **PWA not working**: Verificar manifest.json y sw.js paths

### 8. Performance

- **Edge Functions**: APIs optimizadas para Vercel Edge Runtime
- **Static Generation**: Páginas estáticas donde sea posible
- **Image Optimization**: Automática con Next.js Image component
- **Caching**: Headers configurados en vercel.json

---

## 🚀 Deploy Command Summary

```bash
# 1. Commit changes
git add .
git commit -m "Configuración para deploy en Vercel"
git push origin master

# 2. En Vercel Dashboard:
# - Import GitHub repo
# - Set Root Directory: app-web/
# - Configure Environment Variables
# - Deploy!
```