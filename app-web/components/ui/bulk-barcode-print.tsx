'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Printer, Users, CheckSquare, Square, Settings, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import JsBarcode from 'jsbarcode'

interface Empleado {
  id: string
  codigo: string
  nombre: string
  apellidos: string
  departamento?: string
  activo: boolean
  tipo_usuario: 'empleado' | 'externo'
}

interface BulkBarcodePrintProps {
  empleados: Empleado[]
}

export function BulkBarcodePrint({ empleados }: BulkBarcodePrintProps) {
  const [selectedEmpleados, setSelectedEmpleados] = useState<string[]>([])
  const [barcodeSize, setBarcodeSize] = useState({ width: 2, height: 50 })
  const [includeNames, setIncludeNames] = useState(true)
  const [includeDepartment, setIncludeDepartment] = useState(true)
  const [codesPerPage, setCodesPerPage] = useState(50)
  const [filterType, setFilterType] = useState<'todos' | 'empleado' | 'externo'>('todos')
  const [onlyActive, setOnlyActive] = useState(true)
  const printAreaRef = useRef<HTMLDivElement>(null)

  const filteredEmpleados = empleados.filter(emp => {
    const matchesType = filterType === 'todos' || emp.tipo_usuario === filterType
    const matchesActive = !onlyActive || emp.activo
    return matchesType && matchesActive
  })

  const handleSelectAll = () => {
    if (selectedEmpleados.length === filteredEmpleados.length) {
      setSelectedEmpleados([])
    } else {
      setSelectedEmpleados(filteredEmpleados.map(emp => emp.id))
    }
  }

  const handleSelectEmployee = (empleadoId: string) => {
    setSelectedEmpleados(prev => 
      prev.includes(empleadoId)
        ? prev.filter(id => id !== empleadoId)
        : [...prev, empleadoId]
    )
  }

  const generatePrintPages = () => {
    const selectedEmployees = filteredEmpleados.filter(emp => 
      selectedEmpleados.includes(emp.id)
    )

    if (!printAreaRef.current) return

    // Limpiar área de impresión
    printAreaRef.current.innerHTML = ''

    // Dividir en páginas
    for (let i = 0; i < selectedEmployees.length; i += codesPerPage) {
      const pageEmployees = selectedEmployees.slice(i, i + codesPerPage)
      
      // Crear página
      const page = document.createElement('div')
      page.className = 'print-page'
      page.style.cssText = `
        page-break-after: always;
        padding: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
        width: 100%;
      `

      pageEmployees.forEach(empleado => {
        const card = document.createElement('div')
        card.style.cssText = `
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          background: white;
          page-break-inside: avoid;
        `

        // Nombre del empleado si está habilitado
        if (includeNames) {
          const name = document.createElement('h4')
          name.textContent = `${empleado.nombre} ${empleado.apellidos}`
          name.style.cssText = 'margin: 0 0 8px 0; font-size: 12px; font-weight: bold;'
          card.appendChild(name)
        }

        // Departamento si está habilitado
        if (includeDepartment && empleado.departamento) {
          const dept = document.createElement('p')
          dept.textContent = empleado.departamento
          dept.style.cssText = 'margin: 0 0 8px 0; font-size: 10px; color: #666;'
          card.appendChild(dept)
        }

        // Código de barras
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        JsBarcode(svg, empleado.codigo, {
          format: 'CODE128',
          width: barcodeSize.width,
          height: barcodeSize.height,
          displayValue: true,
          fontSize: 12,
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 4,
          background: '#ffffff',
          lineColor: '#000000'
        })
        card.appendChild(svg)

        // Código en texto
        const code = document.createElement('p')
        code.textContent = `Código: ${empleado.codigo}`
        code.style.cssText = 'margin: 4px 0 0 0; font-size: 10px; font-family: monospace;'
        card.appendChild(code)

        page.appendChild(card)
      })

      printAreaRef.current.appendChild(page)
    }
  }

  const handlePrint = () => {
    generatePrintPages()
    
    setTimeout(() => {
      const printContent = printAreaRef.current?.innerHTML
      if (printContent) {
        const originalContent = document.body.innerHTML
        
        // Crear estilos para impresión
        const printStyles = `
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .print-page:last-child { page-break-after: auto; }
              * { -webkit-print-color-adjust: exact !important; }
            }
          </style>
        `
        
        document.body.innerHTML = printStyles + printContent
        window.print()
        document.body.innerHTML = originalContent
        window.location.reload()
      }
    }, 100)
  }

  const handleDownloadPDF = () => {
    generatePrintPages()
    // Esta función podría expandirse para generar un PDF real
    // Por ahora, usamos la función de impresión del navegador
    setTimeout(() => {
      handlePrint()
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Impresión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Códigos por página</Label>
              <Input
                type="number"
                value={codesPerPage}
                onChange={(e) => setCodesPerPage(Math.max(1, parseInt(e.target.value) || 50))}
                min="1"
                max="100"
              />
            </div>
            <div>
              <Label>Ancho del código</Label>
              <Input
                type="number"
                value={barcodeSize.width}
                onChange={(e) => setBarcodeSize(prev => ({ ...prev, width: Math.max(1, parseInt(e.target.value) || 2) }))}
                min="1"
                max="5"
              />
            </div>
            <div>
              <Label>Alto del código</Label>
              <Input
                type="number"
                value={barcodeSize.height}
                onChange={(e) => setBarcodeSize(prev => ({ ...prev, height: Math.max(20, parseInt(e.target.value) || 50) }))}
                min="20"
                max="100"
              />
            </div>
            <div>
              <Label>Tipo de empleado</Label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'todos' | 'empleado' | 'externo')}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="todos">Todos</option>
                <option value="empleado">Solo Empleados</option>
                <option value="externo">Solo Externos</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-names"
                checked={includeNames}
                onCheckedChange={setIncludeNames}
              />
              <Label htmlFor="include-names">Incluir nombres</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="include-department"
                checked={includeDepartment}
                onCheckedChange={setIncludeDepartment}
              />
              <Label htmlFor="include-department">Incluir departamento</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="only-active"
                checked={onlyActive}
                onCheckedChange={setOnlyActive}
              />
              <Label htmlFor="only-active">Solo empleados activos</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selección de empleados */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Seleccionar Empleados ({filteredEmpleados.length} disponibles)
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedEmpleados.length === filteredEmpleados.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedEmpleados.length === filteredEmpleados.length ? 'Deseleccionar' : 'Seleccionar'} Todo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {filteredEmpleados.map(empleado => (
              <motion.div
                key={empleado.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                  selectedEmpleados.includes(empleado.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelectEmployee(empleado.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">
                      {empleado.nombre} {empleado.apellidos}
                    </h4>
                    <p className="text-xs text-gray-600 font-mono">
                      {empleado.codigo}
                    </p>
                    {empleado.departamento && (
                      <p className="text-xs text-gray-500 truncate">
                        {empleado.departamento}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        empleado.tipo_usuario === 'empleado'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {empleado.tipo_usuario === 'empleado' ? 'EMP' : 'EXT'}
                      </span>
                      {!empleado.activo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          INACTIVO
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-2">
                    {selectedEmpleados.includes(empleado.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {selectedEmpleados.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                {selectedEmpleados.length} empleado{selectedEmpleados.length !== 1 ? 's' : ''} seleccionado{selectedEmpleados.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-600">
                Se imprimirán en {Math.ceil(selectedEmpleados.length / codesPerPage)} página{Math.ceil(selectedEmpleados.length / codesPerPage) !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Button
              onClick={handlePrint}
              disabled={selectedEmpleados.length === 0}
              className="flex-1 h-12"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Códigos Seleccionados
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={selectedEmpleados.length === 0}
              variant="outline"
              className="flex-1 h-12"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Área oculta para generación de impresión */}
      <div ref={printAreaRef} className="hidden"></div>
    </div>
  )
}