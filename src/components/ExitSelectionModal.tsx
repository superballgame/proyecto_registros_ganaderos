import React, { useState } from 'react';
import { X, Truck, Skull, AlertTriangle } from 'lucide-react';

interface ExitSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { tipo: string; cantidad: number }) => void;
}

const ExitSelectionModal: React.FC<ExitSelectionModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(0);

  const handleSave = () => {
    if (!selectedType || cantidad <= 0) {
      alert('Por favor selecciona un tipo y especifica la cantidad');
      return;
    }

    onSave({
      tipo: selectedType,
      cantidad
    });

    // Reset form
    setSelectedType('');
    setCantidad(0);
  };

  const handleClose = () => {
    setSelectedType('');
    setCantidad(0);
    onClose();
  };

  if (!isOpen) return null;

  const exitTypes = [
    {
      id: 'ventas',
      label: 'Venta',
      icon: Truck,
      color: 'green',
      description: 'Venta de animales'
    },
    {
      id: 'muerte',
      label: 'Muerte',
      icon: Skull,
      color: 'red',
      description: 'Muerte natural o enfermedad'
    },
    {
      id: 'robo',
      label: 'Robo',
      icon: AlertTriangle,
      color: 'orange',
      description: 'Robo o pérdida'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Especificar Tipo de Salida</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Selecciona el tipo de salida:
            </h3>
            
            {exitTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <div key={type.id} className="space-y-3">
                  <button
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon 
                        className={`w-6 h-6 ${
                          isSelected 
                            ? `text-${type.color}-600` 
                            : 'text-gray-400'
                        }`} 
                      />
                      <div className="text-left">
                        <p className={`font-medium ${
                          isSelected 
                            ? `text-${type.color}-800` 
                            : 'text-gray-700'
                        }`}>
                          {type.label}
                        </p>
                        <p className={`text-sm ${
                          isSelected 
                            ? `text-${type.color}-600` 
                            : 'text-gray-500'
                        }`}>
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>

                  {isSelected && (
                    <div className="ml-9 animate-fadeIn">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad de animales:
                      </label>
                      <input
                        type="number"
                        value={cantidad}
                        onChange={(e) => setCantidad(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                        placeholder="Ingresa la cantidad"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedType || cantidad <= 0}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
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