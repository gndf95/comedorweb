'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit2, 
  Trash2, 
  QrCode,
  Badge,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/components/auth/AuthProvider'
import { BarcodeModal } from '@/components/ui/barcode-modal'
import { BulkBarcodePrint } from '@/components/ui/bulk-barcode-print'
import { AdvancedStatistics } from '@/components/ui/advanced-statistics'
import { AdminHeader } from '@/components/ui/admin-header'

interface Empleado {
  id: string
  codigo: string
  nombre: string
  apellidos: string
  email: string | null
  telefono: string | null
  departamento: string | null
  activo: boolean
  fecha_registro: string
  ultimo_acceso: string | null
  tipo_usuario: 'empleado' | 'externo' | 'admin'
}

interface EstadisticasEmpleados {
  total: number
  activos: number
  inactivos: number
  empleados: number
  externos: number
  accesos_hoy: number
}

export default function GestionEmpleados() {
  const { user, isAdmin } = useAuth()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasEmpleados>({
    total: 0,
    activos: 0,
    inactivos: 0,
    empleados: 0,
    externos: 0,
    accesos_hoy: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [empleadoEditar, setEmpleadoEditar] = useState<Empleado | null>(null)
  const [empleadoBarcode, setEmpleadoBarcode] = useState<Empleado | null>(null)

  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    codigo: '',
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    departamento: '',
    tipo_usuario: 'empleado' as 'empleado' | 'externo'
  })

  useEffect(() => {
    if (user && isAdmin) {
      cargarDatos()
    }
  }, [user, isAdmin])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [empleadosRes, estadisticasRes] = await Promise.all([
        fetch('/api/empleados'),
        fetch('/api/empleados/estadisticas')
      ])

      const empleadosData = await empleadosRes.json()
      const estadisticasData = await estadisticasRes.json()

      // Asegurar que empleadosData es un array
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : [])
      setEstadisticas(estadisticasData || {
        total: 0,
        activos: 0,
        inactivos: 0,
        empleados: 0,
        externos: 0,
        accesos_hoy: 0
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
      // Establecer valores por defecto en caso de error
      setEmpleados([])
      setEstadisticas({
        total: 0,
        activos: 0,
        inactivos: 0,
        empleados: 0,
        externos: 0,
        accesos_hoy: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const empleadosFiltrados = empleados.filter(empleado => {
    const matchesSearch = `${empleado.nombre} ${empleado.apellidos} ${empleado.codigo} ${empleado.email || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    
    const matchesTipo = filtroTipo === 'todos' || empleado.tipo_usuario === filtroTipo
    const matchesEstado = filtroEstado === 'todos' || 
      (filtroEstado === 'activo' && empleado.activo) ||
      (filtroEstado === 'inactivo' && !empleado.activo)

    return matchesSearch && matchesTipo && matchesEstado
  })

  const generarCodigoSugerido = (tipo: 'empleado' | 'externo') => {
    if (tipo === 'empleado') {
      const empleadosActuales = empleados.filter(e => e.tipo_usuario === 'empleado')
      const maxNum = empleadosActuales.reduce((max, emp) => {
        const num = parseInt(emp.codigo)
        return !isNaN(num) && num > max ? num : max
      }, 0)
      return String(maxNum + 1).padStart(4, '0')
    } else {
      const externosActuales = empleados.filter(e => e.tipo_usuario === 'externo')
      const maxNum = externosActuales.reduce((max, emp) => {
        if (emp.codigo.startsWith('EXT')) {
          const num = parseInt(emp.codigo.substring(3))
          return !isNaN(num) && num > max ? num : max
        }
        return max
      }, 0)
      return `EXT${String(maxNum + 1).padStart(3, '0')}`
    }
  }

  const handleTipoChange = (tipo: 'empleado' | 'externo') => {
    setNuevoEmpleado(prev => ({
      ...prev,
      tipo_usuario: tipo,
      codigo: generarCodigoSugerido(tipo)
    }))
  }

  const handleSubmitEmpleado = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = empleadoEditar ? 'PUT' : 'POST'
      const url = empleadoEditar ? `/api/empleados/${empleadoEditar.id}` : '/api/empleados'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoEmpleado)
      })

      if (response.ok) {
        await cargarDatos()
        setMostrarFormulario(false)
        setEmpleadoEditar(null)
        setNuevoEmpleado({
          codigo: '',
          nombre: '',
          apellidos: '',
          email: '',
          telefono: '',
          departamento: '',
          tipo_usuario: 'empleado'
        })
      }
    } catch (error) {
      console.error('Error guardando empleado:', error)
    }
  }

  const toggleEstadoEmpleado = async (empleado: Empleado) => {
    try {
      const response = await fetch(`/api/empleados/${empleado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...empleado, activo: !empleado.activo })
      })

      if (response.ok) {
        await cargarDatos()
      }
    } catch (error) {
      console.error('Error actualizando estado:', error)
    }
  }

  const eliminarEmpleado = async (empleado: Empleado) => {
    if (confirm(`¿Está seguro de eliminar a ${empleado.nombre} ${empleado.apellidos}?`)) {
      try {
        const response = await fetch(`/api/empleados/${empleado.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await cargarDatos()
        }
      } catch (error) {
        console.error('Error eliminando empleado:', error)
      }
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Acceso Denegado</h2>
            <p className="text-red-600">No tiene permisos para acceder a esta sección.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <AdminHeader
        title="Gestión de Empleados"
        subtitle="Administra usuarios, códigos y accesos del sistema"
        icon={<Users className="w-6 h-6 text-blue-600" />}
        actions={
          <Button 
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Empleado
          </Button>
        }
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >

          <Tabs defaultValue="lista" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border-2 p-1">
              <TabsTrigger value="lista" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Lista de Empleados
              </TabsTrigger>
              <TabsTrigger value="estadisticas" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Badge className="w-4 h-4 mr-2" />
                Estadísticas
              </TabsTrigger>
              <TabsTrigger value="codigos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <QrCode className="w-4 h-4 mr-2" />
                Códigos de Barras
              </TabsTrigger>
              <TabsTrigger value="importar" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Upload className="w-4 h-4 mr-2" />
                Importar/Exportar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="estadisticas">
              <div className="space-y-6">
                {/* Estadísticas básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="border-2 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                            <p className="text-3xl font-bold text-gray-900">{estadisticas.total}</p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-2 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Activos</p>
                            <p className="text-3xl font-bold text-green-600">{estadisticas.activos}</p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="border-2 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Accesos Hoy</p>
                            <p className="text-3xl font-bold text-orange-600">{estadisticas.accesos_hoy}</p>
                          </div>
                          <div className="p-3 bg-orange-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Estadísticas avanzadas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="w-5 h-5" />
                        Estadísticas Detalladas de Accesos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdvancedStatistics />
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="lista">
              <Card className="border-2">
                <CardHeader>
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nombre, código o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="px-3 py-2 border-2 border-gray-300 rounded-md text-sm bg-white text-gray-900 font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="todos">Todos los tipos</option>
                        <option value="empleado">Empleados</option>
                        <option value="externo">Externos</option>
                      </select>
                      <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-3 py-2 border-2 border-gray-300 rounded-md text-sm bg-white text-gray-900 font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="todos">Todos los estados</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Cargando empleados...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      <AnimatePresence>
                        {empleadosFiltrados.map((empleado, index) => (
                          <motion.div
                            key={empleado.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className={`border transition-all hover:shadow-lg hover:border-blue-300 ${
                              empleado.activo ? 'bg-white border-green-300' : 'bg-gray-50 border-gray-300'
                            }`}>
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center space-x-2">
                                    <div className={`p-1.5 rounded-full ${
                                      empleado.tipo_usuario === 'empleado' 
                                        ? 'bg-blue-500' 
                                        : 'bg-orange-500'
                                    }`}>
                                      <Badge className={`w-3 h-3 ${
                                        empleado.tipo_usuario === 'empleado' 
                                          ? 'text-white' 
                                          : 'text-white'
                                      }`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                                        {empleado.nombre} {empleado.apellidos}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded font-mono">
                                          {empleado.codigo}
                                        </span>
                                        <QrCode 
                                          className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer" 
                                          onClick={() => setEmpleadoBarcode(empleado)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Switch
                                      checked={empleado.activo}
                                      onCheckedChange={() => toggleEstadoEmpleado(empleado)}
                                      className="scale-75"
                                    />
                                  </div>
                                </div>

                                {(empleado.email || empleado.departamento) && (
                                  <div className="space-y-1 text-xs text-gray-600">
                                    {empleado.email && (
                                      <div className="truncate">{empleado.email}</div>
                                    )}
                                    {empleado.departamento && (
                                      <div className="truncate">{empleado.departamento}</div>
                                    )}
                                  </div>
                                )}

                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    empleado.tipo_usuario === 'empleado'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-orange-500 text-white'
                                  }`}>
                                    {empleado.tipo_usuario === 'empleado' ? 'EMPLEADO' : 'EXTERNO'}
                                  </span>
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => {
                                        setEmpleadoEditar(empleado)
                                        setNuevoEmpleado({
                                          codigo: empleado.codigo,
                                          nombre: empleado.nombre,
                                          apellidos: empleado.apellidos,
                                          email: empleado.email || '',
                                          telefono: empleado.telefono || '',
                                          departamento: empleado.departamento || '',
                                          tipo_usuario: empleado.tipo_usuario
                                        })
                                        setMostrarFormulario(true)
                                      }}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => eliminarEmpleado(empleado)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="codigos">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <QrCode className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Impresión Masiva de Códigos</h2>
                        <p className="text-gray-600">Genera e imprime códigos de barras en lotes</p>
                      </div>
                    </div>
                  </div>

                  <BulkBarcodePrint empleados={empleados} />
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="importar">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Importar y Exportar Datos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Importar Empleados</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Carga empleados desde un archivo Excel o CSV
                      </p>
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Seleccionar Archivo
                      </Button>
                    </div>

                    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Exportar Empleados</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Descarga la lista completa de empleados
                      </p>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Excel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setMostrarFormulario(false)
              setEmpleadoEditar(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {empleadoEditar ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>

              <form onSubmit={handleSubmitEmpleado} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Usuario</Label>
                    <select
                      value={nuevoEmpleado.tipo_usuario}
                      onChange={(e) => handleTipoChange(e.target.value as 'empleado' | 'externo')}
                      className="w-full mt-1 px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-gray-900 font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      required
                    >
                      <option value="empleado">Empleado</option>
                      <option value="externo">Externo</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={nuevoEmpleado.codigo}
                      onChange={(e) => setNuevoEmpleado(prev => ({ ...prev, codigo: e.target.value }))}
                      placeholder="Código único"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={nuevoEmpleado.nombre}
                      onChange={(e) => setNuevoEmpleado(prev => ({ ...prev, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      value={nuevoEmpleado.apellidos}
                      onChange={(e) => setNuevoEmpleado(prev => ({ ...prev, apellidos: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={nuevoEmpleado.email}
                    onChange={(e) => setNuevoEmpleado(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={nuevoEmpleado.telefono}
                      onChange={(e) => setNuevoEmpleado(prev => ({ ...prev, telefono: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      value={nuevoEmpleado.departamento}
                      onChange={(e) => setNuevoEmpleado(prev => ({ ...prev, departamento: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMostrarFormulario(false)
                      setEmpleadoEditar(null)
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {empleadoEditar ? 'Actualizar' : 'Crear Empleado'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de código de barras */}
      <BarcodeModal
        isOpen={!!empleadoBarcode}
        onClose={() => setEmpleadoBarcode(null)}
        empleado={empleadoBarcode || {} as Empleado}
      />
    </div>
  )
}