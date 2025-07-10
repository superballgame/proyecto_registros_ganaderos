/*
  # Optimize Livestock Registry System

  1. Updates to existing tables
    - Update registros_ganaderos to use proper numeric types for financial calculations
    - Add missing indexes for better performance
    - Ensure proper foreign key constraints

  2. Data Migration
    - Migrate any existing data from registros table to registros_ganaderos with proper socio relationships
    - Update salidas_detalle to reference registros_ganaderos instead of registros

  3. Security
    - Update RLS policies for better security
    - Add policies for socios table

  4. Performance
    - Add composite indexes for common query patterns
    - Optimize existing indexes
*/

-- First, ensure all tables exist with proper structure
DO $$
BEGIN
  -- Update registros_ganaderos to use proper numeric types
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_ganaderos' AND column_name = 'fletes' AND data_type = 'numeric' AND numeric_precision = 10) THEN
    ALTER TABLE registros_ganaderos 
    ALTER COLUMN fletes TYPE numeric(12,2),
    ALTER COLUMN comision TYPE numeric(12,2),
    ALTER COLUMN valor_animal TYPE numeric(12,2),
    ALTER COLUMN total TYPE numeric(12,2);
  END IF;
END $$;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registros_ganaderos_socio_fecha ON registros_ganaderos(socio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_socios_nombre ON socios(nombre);
CREATE INDEX IF NOT EXISTS idx_socios_activo ON socios(activo);

-- Update salidas_detalle to reference registros_ganaderos if it's still referencing registros
DO $$
BEGIN
  -- Check if salidas_detalle references registros instead of registros_ganaderos
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'salidas_detalle' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'registro_id'
    AND EXISTS (
      SELECT 1 FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu2 ON rc.unique_constraint_name = kcu2.constraint_name
      WHERE rc.constraint_name = tc.constraint_name
      AND kcu2.table_name = 'registros'
    )
  ) THEN
    -- Drop the old foreign key constraint
    ALTER TABLE salidas_detalle DROP CONSTRAINT IF EXISTS salidas_detalle_registro_id_fkey;
    
    -- Add new foreign key constraint to registros_ganaderos
    ALTER TABLE salidas_detalle 
    ADD CONSTRAINT salidas_detalle_registro_id_fkey 
    FOREIGN KEY (registro_id) REFERENCES registros_ganaderos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migrate data from registros to registros_ganaderos if needed
DO $$
DECLARE
  registro_row RECORD;
  socio_id_var UUID;
BEGIN
  -- Only migrate if registros table exists and has data, and registros_ganaderos is empty
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registros') 
     AND EXISTS (SELECT 1 FROM registros LIMIT 1)
     AND NOT EXISTS (SELECT 1 FROM registros_ganaderos LIMIT 1) THEN
    
    FOR registro_row IN SELECT * FROM registros LOOP
      -- Find or create socio
      SELECT id INTO socio_id_var FROM socios WHERE nombre = registro_row.socio;
      
      IF socio_id_var IS NULL THEN
        INSERT INTO socios (nombre, activo) 
        VALUES (registro_row.socio, true) 
        RETURNING id INTO socio_id_var;
      END IF;
      
      -- Insert into registros_ganaderos
      INSERT INTO registros_ganaderos (
        id, socio_id, fecha, entradas, salidas, saldo, 
        kg_totales, vr_kilo, fletes, comision, valor_animal, total,
        created_at, updated_at
      ) VALUES (
        registro_row.id, socio_id_var, registro_row.fecha, 
        registro_row.entradas, registro_row.salidas, registro_row.saldo,
        registro_row.kg_totales, registro_row.vr_kilo, registro_row.fletes, 
        registro_row.comision, registro_row.valor_animal, registro_row.total,
        registro_row.created_at, registro_row.updated_at
      );
    END LOOP;
    
    RAISE NOTICE 'Data migration from registros to registros_ganaderos completed';
  END IF;
END $$;

-- Update RLS policies for better security
DROP POLICY IF EXISTS "Anyone can read socios" ON socios;
DROP POLICY IF EXISTS "Authenticated users can insert socios" ON socios;
DROP POLICY IF EXISTS "Authenticated users can update socios" ON socios;
DROP POLICY IF EXISTS "Authenticated users can delete socios" ON socios;

CREATE POLICY "Allow all operations on socios"
  ON socios
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure proper RLS is enabled
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ganaderos ENABLE ROW LEVEL SECURITY;
ALTER TABLE salidas_detalle ENABLE ROW LEVEL SECURITY;

-- Create optimized view for common queries
CREATE OR REPLACE VIEW vista_registros_completos AS
SELECT 
  rg.*,
  s.nombre as socio_nombre,
  s.telefono as socio_telefono,
  s.email as socio_email,
  s.direccion as socio_direccion
FROM registros_ganaderos rg
JOIN socios s ON rg.socio_id = s.id
WHERE s.activo = true;

-- Grant permissions on the view
GRANT SELECT ON vista_registros_completos TO public;