import React, { useState } from 'react';
import { X, DollarSign, Calculator } from 'lucide-react';

interface SaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (valorKilo: number, totalKilos: number) => void;
  cantidad: number;
  socio: string;
  fecha: string;
}

const SaleFormModal: React.FC<SaleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cantidad,
  socio,
  fecha
}) => {
  const [valorKilo, setValorKilo] = useState<string>('');
  const [totalKilos, setTotalKilos] = useState<string>('');

  if (!isOpen) return null;

  const valorTotal = (parseFloat(valorKilo) || 0) * (parseFloat(totalKilos) || 0);

  const handleSave = () => {
    if (valorKilo && totalKilos) {
      onSave(parseFloat(valorKilo), parseFloat(totalKilos));
      setValorKilo('');
      setTotalKilos('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Detalles de Venta
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
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <div className="text-center">
              <span className="text-2xl font-bold text-green-900">{cantidad}</span>
              <p className="text-sm text-green-700">Animales vendidos</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor por Kilo ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valorKilo}
                onChange={(e) => setValorKilo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Kilos
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalKilos}
                onChange={(e) => setTotalKilos(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            {valorTotal > 0 && (
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calculator className="w-5 h-5 text-emerald-600 mr-2" />
                    <span className="font-medium text-emerald-800">Valor Total:</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-900">
                    ${Math.round(valorTotal).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="text-xs text-emerald-600 mt-2">
                  {parseFloat(valorKilo) || 0} × {parseFloat(totalKilos) || 0} = ${Math.round(valorTotal).toLocaleString('es-CO')}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!valorKilo || !totalKilos || valorTotal <= 0}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Guardar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleFormModal;