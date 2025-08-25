import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportesPage() {
  // Datos simulados para el dashboard
  const statsHoy = {
    desayuno: 45,
    comida: 128,
    cena: 67,
    total: 240
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Sistema de Reportes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis y estadísticas del comedor
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">
              ← Volver al Admin
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Desayuno (Hoy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statsHoy.desayuno}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                06:00 - 10:00
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Comida (Hoy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsHoy.comida}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                11:30 - 16:30
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cena (Hoy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statsHoy.cena}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                20:00 - 22:00
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total (Hoy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statsHoy.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                +12% vs ayer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Dashboard Interactivo */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Dashboard Interactivo
              </CardTitle>
              <CardDescription>
                Métricas en tiempo real con gráficos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Gráficos de barras por turno
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Tendencias de 7 días
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Actualización automática
                </p>
              </div>
              <Button className="w-full mt-4">
                Ver Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Reportes por Fecha */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Reportes por Fecha
              </CardTitle>
              <CardDescription>
                Análisis específico por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Selector visual de fechas
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Comparativas entre períodos
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Detalle por empleado
                </p>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Generar Reporte
              </Button>
            </CardContent>
          </Card>

          {/* Exportación */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📄</span>
                Exportar Datos
              </CardTitle>
              <CardDescription>
                Descargar reportes en diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Excel (3 hojas: Resumen/Detalle/Stats)
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • PDF con gráficos
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • CSV para análisis externo
                </p>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Exportar
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Avanzados */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Analytics Avanzados
              </CardTitle>
              <CardDescription>
                Análisis profundo de patrones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Horarios pico por turno
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Patrones de uso semanal
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Predicciones de demanda
                </p>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Reportes Automáticos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Reportes Automáticos
              </CardTitle>
              <CardDescription>
                Programar envío de reportes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Envío diario por email
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Resúmenes semanales
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Alertas de anomalías
                </p>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Configurar
              </Button>
            </CardContent>
          </Card>

          {/* Historial */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                Historial de Reportes
              </CardTitle>
              <CardDescription>
                Acceder a reportes anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Biblioteca de reportes
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Búsqueda por fecha
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • Re-descarga de archivos
                </p>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver Historial
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Resumen Rápido - Últimos 7 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">1,680</div>
                <div className="text-sm text-gray-500">Total Accesos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">240</div>
                <div className="text-sm text-gray-500">Promedio Diario</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">127</div>
                <div className="text-sm text-gray-500">Empleados Activos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">95%</div>
                <div className="text-sm text-gray-500">Ocupación Promedio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}