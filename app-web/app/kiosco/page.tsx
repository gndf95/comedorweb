'use client'

import ScannerUSB from '@/components/scanner/ScannerUSB'

export default function KioscoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🍽️ Sistema de Comedor
        </h1>
        <p className="text-lg text-gray-600">
          Kiosco de registro de entrada
        </p>
      </div>

      <ScannerUSB />

      {/* Instrucciones */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">
            Instrucciones de uso
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-semibold mb-2">1. Escanee su código</div>
              <p>Use el scanner de códigos de barras USB</p>
            </div>
            <div className="text-center">
              <div className="font-semibold mb-2">2. Espere confirmación</div>
              <p>El sistema procesará automáticamente</p>
            </div>
            <div className="text-center">
              <div className="font-semibold mb-2">3. Verifique registro</div>
              <p>Confirme que su entrada fue registrada</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-xs text-gray-500">
            Presione Ctrl + Alt + A para acceso administrativo
          </div>
        </div>
      </div>
    </div>
  )
}