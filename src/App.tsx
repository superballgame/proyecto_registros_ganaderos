import React, { useState, useEffect } from 'react';
import { Cow, Users, TrendingUp, DollarSign, Plus, Eye } from 'lucide-react';
import { sociosService, registrosService, ventasService, salidasDetalleService } from './lib/supabase';
import ExitSelectionModal from './components/ExitSelectionModal';
import SaleFormModal from './components/SaleFormModal';
import ExitDetailsModal from './components/ExitDetailsModal';

function App() {
  const [socios, setSocios] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [selectedSocio, setSelectedSocio] = useState<string>('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [entradas, setEntradas] = useState<number>(0);
  const [salidas, setSalidas] = useState<number>(0);
  const [kgTotales, setKgTotales] = useState<number>(0);
  const [vrKilo, setVrKilo] = useState<number>(0);
  const [fletes, setFletes] = useState<number>(0);
  const [comision, setComision] = useState<number>(0);
  const [valorAnimal, setValorAnimal] = useState<number>(0);
  const [nuevoSocio, setNuevoSocio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSocios: 0,
    totalAnimales: 0,
    totalSalidas: 0,
    ventaTotal: 0
  });

  // Modal states
  const [showExitSelectionModal, setShowExitSelectionModal] = useState(false);
  const [showSaleFormModal, setShowSaleFormModal] = useState(false);
  const [showExitDetailsModal, setShowExitDetailsModal] = useState(false);
  const [selectedExitDetails, setSelectedExitDetails] = useState<any[]>([]);
  const [selectedRegistroForExits, setSelectedRegistroForExits] = useState<any | null>(null);
  const [pendingSaleData, setPendingSaleData] = useState<any>(null);

  useEffect(() => {
    loadSocios();
    loadRegistros();
  }, []);

  useEffect(() => {
    if (selectedSocio) {
      loadRegistrosBySocio(selectedSocio);
      updateStats();
    }
  }, [selectedSocio]);

  const loadSocios = async () => {
    try {
      const data = await sociosService.getAll();
      setSocios(data);
    } catch (error) {
      console.error('Error loading socios:', error);
    }
  };

  const loadRegistros = async () => {
    try {
      const data = await registrosService.getAll();
      setRegistros(data);
    } catch (error) {
      console.error('Error loading registros:', error);
    }
  };

  const loadRegistrosBySocio = async (socioId: string) => {
    try {
      const data = await registrosService.getBySocio(socioId);
      setRegistros(data);
    } catch (error) {
      console.error('Error loading registros by socio:', error);
    }
  };

  const updateStats = async () => {
    try {
      const totalSocios = socios.length;
      const totalAnimales = registros.reduce((sum, reg) => sum + (reg.entradas || 0), 0);
      const totalSalidasCount = registros.reduce((sum, reg) => sum + (reg.salidas || 0), 0);
      
      let ventaTotal = 0;
      if (selectedSocio) {
        ventaTotal = await ventasService.getTotalVentasBySocio(selectedSocio);
      }

      setStats({
        totalSocios,
        totalAnimales,
        totalSalidas: totalSalidasCount,
        ventaTotal
      });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedSocio || !fecha) {
      alert('Por favor selecciona un socio y una fecha');
      return;
    }

    try {
      const total = (kgTotales * vrKilo) + fletes + comision + valorAnimal;
      const saldo = entradas - salidas;

      const registroData = {
        socio_id: selectedSocio,
        fecha,
        entradas: entradas || 0,
        salidas: salidas || 0,
        saldo,
        kg_totales: kgTotales || 0,
        vr_kilo: vrKilo || 0,
        fletes: fletes || 0,
        comision: comision || 0,
        valor_animal: valorAnimal || 0,
        total
      };

      if (editingId) {
        await registrosService.update(editingId, registroData);
      } else {
        await registrosService.create(registroData);
      }

      clearForm();
      loadRegistros();
      if (selectedSocio) {
        loadRegistrosBySocio(selectedSocio);
      }
      updateStats();
    } catch (error) {
      console.error('Error saving registro:', error);
      alert('Error al guardar el registro');
    }
  };

  const handleSaveExit = async (exitData: any) => {
    try {
      if (!selectedSocio || !fecha) {
        alert('Por favor selecciona un socio y una fecha');
        return;
      }

      // Calculate saldo
      const saldo = entradas - exitData.cantidad;

      // Create or update registro
      const registroData = {
        socio_id: selectedSocio,
        fecha,
        entradas: entradas || 0,
        salidas: exitData.cantidad,
        saldo,
        kg_totales: kgTotales || 0,
        vr_kilo: vrKilo || 0,
        fletes: fletes || 0,
        comision: comision || 0,
        valor_animal: valorAnimal || 0,
        total: (kgTotales * vrKilo) + fletes + comision + valorAnimal
      };

      let registroId;
      if (editingId) {
        await registrosService.update(editingId, registroData);
        registroId = editingId;
      } else {
        const newRegistro = await registrosService.create(registroData);
        registroId = newRegistro.id;
      }

      // Save exit details
      await salidasDetalleService.create({
        registro_id: registroId,
        socio: selectedSocio,
        fecha,
        cantidad: exitData.cantidad,
        causa: exitData.tipo
      });

      // If it's a sale, save to ventas table and open sale form
      if (exitData.tipo === 'ventas') {
        setPendingSaleData({
          socio_id: selectedSocio,
          registro_id: registroId,
          fecha,
          cantidad: exitData.cantidad,
          tipo: 'venta'
        });
        setShowSaleFormModal(true);
      }

      setSalidas(exitData.cantidad);
      setShowExitSelectionModal(false);
      
      if (exitData.tipo !== 'ventas') {
        clearForm();
        loadRegistros();
        if (selectedSocio) {
          loadRegistrosBySocio(selectedSocio);
        }
        updateStats();
      }
    } catch (error) {
      console.error('Error saving exit:', error);
      alert('Error al guardar la salida: ' + (error as Error).message);
    }
  };

  const handleSaveSale = async (saleData: any) => {
    try {
      if (!pendingSaleData) return;

      await ventasService.create({
        ...pendingSaleData,
        valor_kilo: saleData.valorKilo,
        total_kilos: saleData.totalKilos,
        valor_total: saleData.valorTotal
      });

      setShowSaleFormModal(false);
      setPendingSaleData(null);
      clearForm();
      loadRegistros();
      if (selectedSocio) {
        loadRegistrosBySocio(selectedSocio);
      }
      updateStats();
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error al guardar la venta');
    }
  };

  const handleSaveSocio = async () => {
    if (!nuevoSocio.trim()) {
      alert('Por favor ingresa el nombre del socio');
      return;
    }

    try {
      await sociosService.create({
        nombre: nuevoSocio,
        telefono: telefono || null,
        email: email || null,
        direccion: direccion || null
      });

      setNuevoSocio('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      setShowForm(false);
      loadSocios();
      updateStats();
    } catch (error) {
      console.error('Error saving socio:', error);
      alert('Error al guardar el socio');
    }
  };

  const handleEdit = (registro: any) => {
    setSelectedSocio(registro.socio_id);
    setFecha(registro.fecha);
    setEntradas(registro.entradas || 0);
    setSalidas(registro.salidas || 0);
    setKgTotales(registro.kg_totales || 0);
    setVrKilo(registro.vr_kilo || 0);
    setFletes(registro.fletes || 0);
    setComision(registro.comision || 0);
    setValorAnimal(registro.valor_animal || 0);
    setEditingId(registro.id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      try {
        await registrosService.delete(id);
        loadRegistros();
        if (selectedSocio) {
          loadRegistrosBySocio(selectedSocio);
        }
        updateStats();
      } catch (error) {
        console.error('Error deleting registro:', error);
        alert('Error al eliminar el registro');
      }
    }
  };

  const handleViewExitDetails = async (registro: any) => {
    try {
      const details = await salidasDetalleService.getByRegistro(registro.id);
      setSelectedExitDetails(details);
      setSelectedRegistroForExits(registro);
      setShowExitDetailsModal(true);
    } catch (error) {
      console.error('Error loading exit details:', error);
    }
  };

  const clearForm = () => {
    setSelectedSocio('');
    setFecha(new Date().toISOString().split('T')[0]);
    setEntradas(0);
    setSalidas(0);
    setKgTotales(0);
    setVrKilo(0);
    setFletes(0);
    setComision(0);
    setValorAnimal(0);
    setEditingId(null);
  };

  const handleSalidasClick = () => {
    if (!selectedSocio || !fecha) {
      alert('Por favor selecciona un socio y una fecha primero');
      return;
    }
    setShowExitSelectionModal(true);
  };

  const total = (kgTotales * vrKilo) + fletes + comision + valorAnimal;
  const saldo = entradas - salidas;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Cow className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800">Sistema Ganadero</h1>
          </div>
          <p className="text-gray-600 text-lg">Gestión integral de registros ganaderos</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Socios</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSocios}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Animales</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAnimales}</p>
              </div>
              <Cow className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Salidas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSalidas}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Venta Total</p>
                <p className="text-3xl font-bold text-gray-900">${stats.ventaTotal.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingId ? 'Editar Registro' : 'Nuevo Registro Ganadero'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Socio
                  </label>
                  <select
                    value={selectedSocio}
                    onChange={(e) => setSelectedSocio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar socio</option>
                    {socios.map((socio) => (
                      <option key={socio.id} value={socio.id}>
                        {socio.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entradas
                  </label>
                  <input
                    type="number"
                    value={entradas}
                    onChange={(e) => setEntradas(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salidas
                  </label>
                  <input
                    type="text"
                    value={salidas > 0 ? salidas : "Clic para especificar salidas"}
                    onClick={handleSalidasClick}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kg Totales
                  </label>
                  <input
                    type="number"
                    value={kgTotales}
                    onChange={(e) => setKgTotales(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor por Kilo
                  </label>
                  <input
                    type="number"
                    value={vrKilo}
                    onChange={(e) => setVrKilo(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fletes
                  </label>
                  <input
                    type="number"
                    value={fletes}
                    onChange={(e) => setFletes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comisión
                  </label>
                  <input
                    type="number"
                    value={comision}
                    onChange={(e) => setComision(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Animal
                  </label>
                  <input
                    type="number"
                    value={valorAnimal}
                    onChange={(e) => setValorAnimal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saldo
                  </label>
                  <input
                    type="number"
                    value={saldo}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total
                  </label>
                  <input
                    type="number"
                    value={total}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {editingId ? 'Actualizar' : 'Guardar'} Registro
                </button>
                {editingId && (
                  <button
                    onClick={clearForm}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Socios Section */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Socios</h3>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {showForm && (
                <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre del socio"
                      value={nuevoSocio}
                      onChange={(e) => setNuevoSocio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono (opcional)"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email (opcional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Dirección (opcional)"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSaveSocio}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Guardar Socio
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {socios.map((socio) => (
                  <div
                    key={socio.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSocio === socio.id
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedSocio(socio.id)}
                  >
                    <p className="font-medium text-gray-800">{socio.nombre}</p>
                    {socio.telefono && (
                      <p className="text-sm text-gray-600">{socio.telefono}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Registros Table */}
        <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">Registros Ganaderos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Socio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entradas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salidas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registros.map((registro) => (
                  <tr key={registro.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registro.socio_nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(registro.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registro.entradas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {registro.salidas}
                        {registro.salidas > 0 && (
                          <button
                            onClick={() => handleViewExitDetails(registro)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver detalles de salidas"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registro.saldo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${registro.total?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(registro)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(registro.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExitSelectionModal
        isOpen={showExitSelectionModal}
        onClose={() => setShowExitSelectionModal(false)}
        onSave={handleSaveExit}
      />

      <SaleFormModal
        isOpen={showSaleFormModal}
        onClose={() => {
          setShowSaleFormModal(false);
          setPendingSaleData(null);
        }}
        onSave={handleSaveSale}
      />

      <ExitDetailsModal
        isOpen={showExitDetailsModal}
        onClose={() => setShowExitDetailsModal(false)}
        exitDetails={selectedExitDetails}
        registro={selectedRegistroForExits}
      />
    </div>
  );
}

export default App;