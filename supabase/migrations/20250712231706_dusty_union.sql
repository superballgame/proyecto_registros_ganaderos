/*
  # Crear tabla de ventas

  1. Nueva Tabla
    - `ventas`
      - `id` (uuid, clave primaria)
      - `socio_id` (uuid, referencia a socios)
      - `registro_id` (uuid, referencia a registros_ganaderos)
      - `fecha` (date, fecha de la venta)
      - `cantidad` (integer, cantidad de animales)
      - `tipo` (text, tipo: venta, muerte, robo)
      - `valor_kilo` (numeric, valor por kilo - solo para ventas)
      - `total_kilos` (numeric, total de kilos - solo para ventas)
      - `valor_total` (numeric, valor total de la venta)
      - `created_at` (timestamp, fecha de creación)

  2. Seguridad
    - Habilitar RLS en la tabla
    - Políticas para permitir operaciones a usuarios públicos

  3. Índices
    - Índices en campos de búsqueda frecuente
*/

-- Crear tabla ventas
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id uuid NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
  registro_id uuid REFERENCES registros_ganaderos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  cantidad integer NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('venta', 'muerte', 'robo')),
  valor_kilo numeric(10,2) DEFAULT 0,
  total_kilos numeric(10,2) DEFAULT 0,
  valor_total numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ventas_socio_id ON ventas(socio_id);
CREATE INDEX IF NOT EXISTS idx_ventas_registro_id ON ventas(registro_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo ON ventas(tipo);

-- Habilitar Row Level Security
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Allow all operations on ventas"
  ON ventas
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);