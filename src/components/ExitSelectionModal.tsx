import React, { useState } from 'react';
import { X, DollarSign, Skull, Shield } from 'lucide-react';
import { tipoVentaLabels } from '../lib/supabase';

interface ExitSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'venta' | 'muerte' | 'robo', cantidad: number) => void;
  totalExits: number;
  socio: string;
  fecha: string;
}

const ExitSelectionModal: React.FC<ExitSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  totalExits,
  socio,
  fecha
}) => {
  const [selectedType, setSelectedType] = useState<'venta' | 'muerte' | 'robo' | null>(null);
  const [cantidad, setCantidad] = useState<number>(totalExits);

  if (!isOpen) return null;

  const getIconForType = (tipo: 'venta' | 'muerte' | 'robo') => {
    switch (tipo) {
      case 'venta':
        return <DollarSign className="w-6 h-6 text-green-600" />;
      case 'muerte':
        return <Skull className="w-6 h-6 text-red-600" />;
      case 'robo':
        return <Shield className="w-6 h-6 text-orange-600" />;
    }
  };

  const getColorForType = (tipo: 'venta' | 'muerte' | 'robo') => {
    switch (tipo) {
      case 'venta':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'muerte':
        return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'robo':
        return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
    }
  };

  const handleTypeSelect = (tipo: 'venta' | 'muerte' | 'robo') => {
    setSelectedType(tipo);
  };

  const handleConfirm = () => {
    if (selectedType && cantidad > 0) {
      onSelectType(selectedType, cantidad);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Tipo de Salida
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {socio} - {new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de animales
            </label>
            <input
              type="number"
              min="1"
              max={totalExits}
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Selecciona el tipo de salida:
            </p>
            
            {(['venta', 'muerte', 'robo'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => handleTypeSelect(tipo)}
                className={`w-full p-4 border-2 rounded-lg transition-all ${getColorForType(tipo)} ${
                  selectedType === tipo ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <div className="flex items-center">
                  {getIconForType(tipo)}
                  <span className="ml-3 font-medium text-gray-900">
                    {tipoVentaLabels[tipo]}
                  </span>
                  {selectedType === tipo && (
                    <div className="ml-auto">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedType || cantidad <= 0}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitSelectionModal;