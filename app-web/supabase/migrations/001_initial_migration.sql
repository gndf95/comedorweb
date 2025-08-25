-- ============================================================================
-- MIGRACIÓN COMPLETA SISTEMA DE COMEDOR: SQLite → PostgreSQL
-- Equivalente a la estructura Python original + mejoras empresariales
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLA USUARIOS (migrada desde SQLite + mejoras)
-- ============================================================================

-- Eliminar tabla si existe (para re-ejecución)
DROP TABLE IF EXISTS public.usuarios CASCADE;

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) UNIQUE NOT NULL,           -- 0001-9999, EXT001-EXT025
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('EMPLEADO', 'EXTERNO')),
    activo BOOLEAN DEFAULT true,
    email VARCHAR(255),                           -- Nuevo: para notificaciones
    telefono VARCHAR(20),                         -- Nuevo: contacto
    departamento VARCHAR(100),                    -- Nuevo: organización
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadatos adicionales
    foto_url TEXT,                                -- Nuevo: foto de perfil
    notas TEXT,                                   -- Nuevo: observaciones
    creado_por UUID,                              -- Auditoria: quien lo creó
    
    -- Constraints de negocio
    CONSTRAINT usuarios_codigo_formato CHECK (
        (tipo = 'EMPLEADO' AND codigo ~ '^\d{4}$') OR
        (tipo = 'EXTERNO' AND codigo ~ '^EXT\d{3}$')
    )
);

-- Índices optimizados para performance (migrados desde SQLite)
CREATE INDEX idx_usuarios_codigo ON public.usuarios(codigo);
CREATE INDEX idx_usuarios_tipo ON public.usuarios(tipo);
CREATE INDEX idx_usuarios_activo ON public.usuarios(activo) WHERE activo = true;
CREATE INDEX idx_usuarios_email ON public.usuarios(email) WHERE email IS NOT NULL;
CREATE INDEX idx_usuarios_nombre ON public.usuarios USING gin(to_tsvector('spanish', nombre));

-- ============================================================================
-- 2. TABLA TURNOS_CONFIG (nueva - mejora del sistema original)
-- ============================================================================

CREATE TABLE public.turnos_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno VARCHAR(20) NOT NULL UNIQUE,            -- 'DESAYUNO', 'COMIDA', 'CENA'
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT true,
    descripcion TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de turnos (migrados del sistema Python)
INSERT INTO public.turnos_config (turno, hora_inicio, hora_fin, descripcion) VALUES
('DESAYUNO', '06:00:00', '10:00:00', 'Horario de desayuno matutino'),
('COMIDA', '11:30:00', '16:30:00', 'Horario de almuerzo'),
('CENA', '20:00:00', '22:00:00', 'Horario de cena nocturno');

-- ============================================================================
-- 3. TABLA REGISTROS_COMEDOR (migrada desde SQLite + mejoras)
-- ============================================================================

DROP TABLE IF EXISTS public.registros_comedor CASCADE;

CREATE TABLE public.registros_comedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,                     -- FK mejorado (UUID en lugar de codigo)
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    turno VARCHAR(20) NOT NULL,
    timestamp_completo TIMESTAMPTZ DEFAULT NOW(),
    
    -- Campos migrados desde SQLite (mantener compatibilidad)
    codigo VARCHAR(10) NOT NULL,                  -- Cache para queries rápidas
    nombre VARCHAR(255) NOT NULL,                 -- Cache del nombre
    tipo VARCHAR(20) NOT NULL,                    -- Cache del tipo
    
    -- Nuevos campos para sistema web
    ip_address INET,                              -- IP del cliente
    user_agent TEXT,                              -- Browser info
    dispositivo VARCHAR(50) DEFAULT 'KIOSCO',     -- 'KIOSCO', 'MOBILE', 'DESKTOP'
    metodo_entrada VARCHAR(20) DEFAULT 'CODIGO',  -- 'CODIGO', 'QR', 'MANUAL'
    
    -- Auditoría y metadata
    procesado_por UUID,                           -- Usuario admin que procesó
    notas TEXT,                                   -- Observaciones
    
    FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (turno) REFERENCES public.turnos_config(turno),
    
    -- Constraint de negocio: un usuario no puede registrarse dos veces en el mismo turno/día
    CONSTRAINT unique_user_turno_fecha UNIQUE (usuario_id, turno, fecha)
);

-- Índices optimizados (migrados desde SQLite)
CREATE INDEX idx_registros_fecha ON public.registros_comedor(fecha DESC);
CREATE INDEX idx_registros_usuario_fecha ON public.registros_comedor(usuario_id, fecha DESC);
CREATE INDEX idx_registros_turno_fecha ON public.registros_comedor(turno, fecha DESC);
CREATE INDEX idx_registros_timestamp ON public.registros_comedor(timestamp_completo DESC);
CREATE INDEX idx_registros_codigo_fecha ON public.registros_comedor(codigo, fecha DESC);
CREATE INDEX idx_registros_tipo_fecha ON public.registros_comedor(tipo, fecha DESC);

-- ============================================================================
-- 4. TABLA CONFIGURACIONES (nueva - migrada desde config.ini)
-- ============================================================================

CREATE TABLE public.configuraciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'STRING',            -- STRING, INTEGER, BOOLEAN, JSON
    categoria VARCHAR(50) DEFAULT 'GENERAL',      -- GENERAL, TURNOS, BACKUP, etc.
    descripcion TEXT,
    editable BOOLEAN DEFAULT true,                -- Permite edición desde UI
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por UUID                          -- Auditoría
);

-- Configuraciones iniciales migradas del sistema Python original
INSERT INTO public.configuraciones (clave, valor, tipo, categoria, descripcion) VALUES
('MODO_KIOSCO', 'true', 'BOOLEAN', 'GENERAL', 'Activar modo kiosco pantalla completa'),
('AUTO_FULLSCREEN', 'true', 'BOOLEAN', 'GENERAL', 'Pantalla completa automática'),
('BACKUP_AUTOMATICO', 'true', 'BOOLEAN', 'BACKUP', 'Backup automático habilitado'),
('INTERVALO_BACKUP_HORAS', '24', 'INTEGER', 'BACKUP', 'Frecuencia de backup en horas'),
('NIVEL_LOGGING', 'INFO', 'STRING', 'SISTEMA', 'Nivel de logging del sistema'),
('DIAS_RETENCION_LOGS', '30', 'INTEGER', 'SISTEMA', 'Días de retención de logs'),
('REFRESH_INTERVAL_MS', '30000', 'INTEGER', 'UI', 'Intervalo de actualización UI'),
('SISTEMA_VERSION', '1.0.0-web', 'STRING', 'SISTEMA', 'Versión del sistema web'),
('EMPLEADOS_TOTAL', '0', 'INTEGER', 'STATS', 'Total empleados activos'),
('EXTERNOS_TOTAL', '25', 'INTEGER', 'STATS', 'Total visitantes externos');

CREATE INDEX idx_configuraciones_categoria ON public.configuraciones(categoria);
CREATE INDEX idx_configuraciones_editable ON public.configuraciones(editable) WHERE editable = true;

-- ============================================================================
-- 5. TABLA AUDITORIA_LOGS (nueva - para trazabilidad empresarial)
-- ============================================================================

CREATE TABLE public.auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla_afectada VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL,                  -- INSERT, UPDATE, DELETE
    registro_id UUID,                             -- ID del registro afectado
    usuario_id UUID,                              -- Usuario que realizó la acción
    timestamp_accion TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Datos del cambio
    datos_anteriores JSONB,                       -- Estado anterior
    datos_nuevos JSONB,                           -- Estado nuevo
    
    -- Metadatos
    contexto VARCHAR(100),                        -- 'WEB_ADMIN', 'API', 'KIOSCO'
    notas TEXT
);

-- Índices para auditoría
CREATE INDEX idx_auditoria_tabla_timestamp ON public.auditoria_logs(tabla_afectada, timestamp_accion DESC);
CREATE INDEX idx_auditoria_usuario ON public.auditoria_logs(usuario_id);
CREATE INDEX idx_auditoria_timestamp ON public.auditoria_logs(timestamp_accion DESC);

-- ============================================================================
-- 6. TABLA METRICAS_SISTEMA (nueva - para análisis de performance)
-- ============================================================================

CREATE TABLE public.metricas_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp_medicion TIMESTAMPTZ DEFAULT NOW(),
    tipo_metrica VARCHAR(50) NOT NULL,            -- CPU, MEMORIA, DISCO, USUARIOS_ACTIVOS
    valor_numerico DECIMAL(10,2),
    valor_texto TEXT,
    metadatos JSONB,                               -- Datos adicionales flexibles
    
    -- Para métricas específicas del comedor
    fecha_referencia DATE,                         -- Para métricas por día
    turno_referencia VARCHAR(20)                   -- Para métricas por turno
);

-- Índices para métricas
CREATE INDEX idx_metricas_tipo_timestamp ON public.metricas_sistema(tipo_metrica, timestamp_medicion DESC);
CREATE INDEX idx_metricas_fecha ON public.metricas_sistema(fecha_referencia DESC) WHERE fecha_referencia IS NOT NULL;

-- ============================================================================
-- 7. FUNCIONES DE UTILIDAD (migradas desde Python)
-- ============================================================================

-- Función para obtener turno actual (migrada desde sistema_turnos.py)
CREATE OR REPLACE FUNCTION public.obtener_turno_actual()
RETURNS TABLE(turno VARCHAR, nombre VARCHAR, activo BOOLEAN) AS $$
DECLARE
    hora_actual TIME := CURRENT_TIME;
BEGIN
    RETURN QUERY
    SELECT 
        tc.turno,
        tc.descripcion as nombre,
        (hora_actual BETWEEN tc.hora_inicio AND tc.hora_fin) as activo
    FROM public.turnos_config tc
    WHERE tc.activo = true
    ORDER BY 
        CASE 
            WHEN hora_actual BETWEEN tc.hora_inicio AND tc.hora_fin THEN 1
            ELSE 2
        END,
        tc.hora_inicio;
END;
$$ LANGUAGE plpgsql;

-- Función para validar entrada duplicada (migrada desde sistema_turnos.py)
CREATE OR REPLACE FUNCTION public.ya_escaneo_en_turno(
    p_usuario_id UUID,
    p_turno VARCHAR,
    p_fecha DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.registros_comedor 
        WHERE usuario_id = p_usuario_id 
        AND turno = p_turno 
        AND fecha = p_fecha
    );
END;
$$ LANGUAGE plpgsql;

-- Función para buscar usuario por código (migrada desde sistema_turnos.py)
CREATE OR REPLACE FUNCTION public.buscar_usuario_por_codigo(p_codigo VARCHAR)
RETURNS TABLE(
    id UUID,
    codigo VARCHAR,
    nombre VARCHAR,
    tipo VARCHAR,
    activo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.codigo, u.nombre, u.tipo, u.activo
    FROM public.usuarios u
    WHERE u.codigo = p_codigo AND u.activo = true;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar entrada (migrada desde sistema_turnos.py)
CREATE OR REPLACE FUNCTION public.registrar_entrada(
    p_codigo VARCHAR,
    p_turno VARCHAR,
    p_dispositivo VARCHAR DEFAULT 'KIOSCO',
    p_metodo_entrada VARCHAR DEFAULT 'CODIGO',
    p_ip_address INET DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_usuario public.usuarios%ROWTYPE;
    v_registro_id UUID;
    v_ahora TIMESTAMPTZ := NOW();
    v_fecha DATE := CURRENT_DATE;
    v_hora TIME := CURRENT_TIME;
    v_resultado JSONB;
BEGIN
    -- Buscar usuario
    SELECT * INTO v_usuario FROM public.usuarios WHERE codigo = p_codigo AND activo = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CODIGO_NO_ENCONTRADO',
            'mensaje', 'Código de empleado no encontrado o inactivo'
        );
    END IF;
    
    -- Verificar si ya se registró en este turno hoy
    IF public.ya_escaneo_en_turno(v_usuario.id, p_turno, v_fecha) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'YA_REGISTRADO',
            'mensaje', 'Ya se registró en este turno hoy',
            'usuario', v_usuario.nombre
        );
    END IF;
    
    -- Insertar registro
    INSERT INTO public.registros_comedor (
        usuario_id, fecha, hora, turno, timestamp_completo,
        codigo, nombre, tipo, dispositivo, metodo_entrada, ip_address
    ) VALUES (
        v_usuario.id, v_fecha, v_hora, p_turno, v_ahora,
        v_usuario.codigo, v_usuario.nombre, v_usuario.tipo, 
        p_dispositivo, p_metodo_entrada, p_ip_address
    ) RETURNING id INTO v_registro_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'registro_id', v_registro_id,
        'usuario', jsonb_build_object(
            'codigo', v_usuario.codigo,
            'nombre', v_usuario.nombre,
            'tipo', v_usuario.tipo
        ),
        'turno', p_turno,
        'fecha', v_fecha,
        'hora', v_hora
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. TRIGGERS AUTOMÁTICOS
-- ============================================================================

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION public.update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER trigger_usuarios_update 
    BEFORE UPDATE ON public.usuarios 
    FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();

CREATE TRIGGER trigger_configuraciones_update 
    BEFORE UPDATE ON public.configuraciones 
    FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();

CREATE TRIGGER trigger_turnos_config_update 
    BEFORE UPDATE ON public.turnos_config 
    FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();

-- Trigger para auditoría automática
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_data JSONB;
BEGIN
    -- Solo auditar INSERT, UPDATE, DELETE
    IF TG_OP = 'INSERT' THEN
        audit_data = to_jsonb(NEW);
        INSERT INTO public.auditoria_logs (
            tabla_afectada, accion, registro_id, timestamp_accion, 
            datos_nuevos, contexto
        ) VALUES (
            TG_TABLE_NAME, TG_OP, 
            CASE WHEN NEW.id IS NOT NULL THEN NEW.id ELSE gen_random_uuid() END,
            NOW(), audit_data, 'TRIGGER_AUTO'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.auditoria_logs (
            tabla_afectada, accion, registro_id, timestamp_accion,
            datos_anteriores, datos_nuevos, contexto
        ) VALUES (
            TG_TABLE_NAME, TG_OP, NEW.id, NOW(),
            to_jsonb(OLD), to_jsonb(NEW), 'TRIGGER_AUTO'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.auditoria_logs (
            tabla_afectada, accion, registro_id, timestamp_accion,
            datos_anteriores, contexto
        ) VALUES (
            TG_TABLE_NAME, TG_OP, OLD.id, NOW(),
            to_jsonb(OLD), 'TRIGGER_AUTO'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoría a tablas críticas
CREATE TRIGGER audit_usuarios_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_registros_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.registros_comedor
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- ============================================================================
-- 9. VISTA MATERIALIZADA PARA PERFORMANCE
-- ============================================================================

-- Vista para estadísticas rápidas por día (migrada de reportes Python)
CREATE MATERIALIZED VIEW public.stats_diarias AS
SELECT 
    fecha,
    turno,
    COUNT(*) as total_registros,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(*) FILTER (WHERE tipo = 'EMPLEADO') as empleados,
    COUNT(*) FILTER (WHERE tipo = 'EXTERNO') as externos,
    MIN(timestamp_completo) as primer_registro,
    MAX(timestamp_completo) as ultimo_registro
FROM public.registros_comedor
GROUP BY fecha, turno;

-- Índice en vista materializada
CREATE INDEX idx_stats_diarias_fecha ON public.stats_diarias(fecha DESC);
CREATE INDEX idx_stats_diarias_turno ON public.stats_diarias(turno);

-- Función para refresh de stats
CREATE OR REPLACE FUNCTION public.refresh_stats_diarias()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.stats_diarias;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) - SEGURIDAD EMPRESARIAL
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_comedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. DATOS INICIALES DE PRUEBA
-- ============================================================================

-- Usuarios de prueba para desarrollo
INSERT INTO public.usuarios (codigo, nombre, tipo, activo, email, departamento) VALUES
('0001', 'USUARIO PRUEBA 001', 'EMPLEADO', true, 'prueba001@empresa.com', 'DESARROLLO'),
('0002', 'USUARIO PRUEBA 002', 'EMPLEADO', true, 'prueba002@empresa.com', 'ADMINISTRACION'),
('EXT001', 'VISITANTE EXTERNO 001', 'EXTERNO', true, null, null),
('EXT002', 'VISITANTE EXTERNO 002', 'EXTERNO', true, null, null);

-- Actualizar contador de usuarios
UPDATE public.configuraciones 
SET valor = '2' 
WHERE clave = 'EMPLEADOS_TOTAL';

-- ============================================================================
-- MIGRACIÓN COMPLETADA EXITOSAMENTE
-- ============================================================================

-- Verificación final
DO $$
DECLARE
    tabla_count INTEGER;
    funcion_count INTEGER;
BEGIN
    -- Contar tablas creadas
    SELECT COUNT(*) INTO tabla_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('usuarios', 'registros_comedor', 'turnos_config', 'configuraciones', 'auditoria_logs', 'metricas_sistema');
    
    -- Contar funciones creadas
    SELECT COUNT(*) INTO funcion_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_name IN ('obtener_turno_actual', 'ya_escaneo_en_turno', 'buscar_usuario_por_codigo', 'registrar_entrada');
    
    RAISE NOTICE 'MIGRACIÓN COMPLETADA:';
    RAISE NOTICE '- Tablas creadas: %', tabla_count;
    RAISE NOTICE '- Funciones creadas: %', funcion_count;
    RAISE NOTICE '- RLS habilitado en todas las tablas';
    RAISE NOTICE '- Índices optimizados aplicados';
    RAISE NOTICE '- Triggers de auditoría configurados';
    RAISE NOTICE '- Vista materializada para performance creada';
    RAISE NOTICE 'Sistema listo para producción.';
END $$;