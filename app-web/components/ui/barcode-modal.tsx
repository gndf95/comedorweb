'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Printer, Copy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import JsBarcode from 'jsbarcode'

interface BarcodeModalProps {
  isOpen: boolean
  onClose: () => void
  empleado: {
    id: string
    codigo: string
    nombre: string
    apellidos: string
    departamento?: string
  }
}

export function BarcodeModal({ isOpen, onClose, empleado }: BarcodeModalProps) {
  const [copying, setCopying] = useState(false)
  const barcodeRef = useRef<SVGSVGElement>(null)
  const printBarcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (isOpen && empleado.codigo && barcodeRef.current && printBarcodeRef.current) {
      // Generar código de barras para visualización
      JsBarcode(barcodeRef.current, empleado.codigo, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 8,
        fontOptions: 'bold',
        background: '#ffffff',
        lineColor: '#000000'
      })

      // Generar código de barras para impresión
      JsBarcode(printBarcodeRef.current, empleado.codigo, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 8,
        fontOptions: 'bold',
        background: '#ffffff',
        lineColor: '#000000'
      })
    }
  }, [isOpen, empleado.codigo])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(empleado.codigo)
      setCopying(true)
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      console.error('Error copiando código:', error)
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById('barcode-print-area')
    if (printContent) {
      const originalContent = document.body.innerHTML
      document.body.innerHTML = printContent.innerHTML
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }
  }

  const handleDownload = () => {
    if (barcodeRef.current) {
      // Convertir SVG a canvas y luego descargar
      const svgData = new XMLSerializer().serializeToString(barcodeRef.current)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        const link = document.createElement('a')
        link.download = `barcode-${empleado.codigo}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl"
          >
            <Card className="border-0 shadow-none">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Código de Barras
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Información del empleado */}
                <div className="text-center space-y-2">
                  <h4 className="font-medium text-gray-900">
                    {empleado.nombre} {empleado.apellidos}
                  </h4>
                  {empleado.departamento && (
                    <p className="text-sm text-gray-600">
                      {empleado.departamento}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-mono font-bold text-gray-700">
                      {empleado.codigo}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCode}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className={`w-3 h-3 ${copying ? 'text-green-600' : 'text-gray-500'}`} />
                    </Button>
                  </div>
                  {copying && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-green-600 font-medium"
                    >
                      ✅ Código copiado
                    </motion.p>
                  )}
                </div>

                {/* Código de barras */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex justify-center">
                    <svg ref={barcodeRef}></svg>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    onClick={handlePrint}
                    className="flex-1 h-10"
                    variant="outline"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="flex-1 h-10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>

                {/* Área oculta para impresión */}
                <div id="barcode-print-area" className="hidden">
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    <h2 style={{ marginBottom: '10px' }}>
                      {empleado.nombre} {empleado.apellidos}
                    </h2>
                    {empleado.departamento && (
                      <p style={{ marginBottom: '20px', color: '#666' }}>
                        {empleado.departamento}
                      </p>
                    )}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                      <svg ref={printBarcodeRef}></svg>
                    </div>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      Sistema de Gestión de Comedor - Código: {empleado.codigo}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}