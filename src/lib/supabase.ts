import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase configuration:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing'
});
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '[HIDDEN]' : 'undefined'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Socio {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RegistroGanadero {
  id: string;
  socio_id: string;
  fecha: string;
  entradas: number;
  salidas: number;
  saldo: number;
  kg_totales: number;
  vr_kilo: number;
  fletes: number;
  comision: number;
  valor_animal: number;
  total: number;
  created_at?: string;
  updated_at?: string;
  // Joined data
  socio?: Socio;
}

// Legacy interface for backward compatibility
export interface Registro {
  id: string;
  socio: string;
  fecha: string;
  entradas: number;
  salidas: number;
  saldo: number;
  kg_totales: number;
  vr_kilo: number;
  fletes: number;
  comision: number;
  valor_animal: number;
  total: number;
  created_at?: string;
  updated_at?: string;
}

export interface SalidaDetalle {
  id: string;
  registro_id: string;
  socio: string;
  fecha: string;
  cantidad: number;
  causa: 'ventas' | 'muerte' | 'robo';
  created_at?: string;
}

export interface Venta {
  id: string;
  socio_id: string;
  registro_id?: string;
  fecha: string;
  cantidad: number;
  tipo: 'venta' | 'muerte' | 'robo';
  valor_kilo: number;
  total_kilos: number;
  valor_total: number;
  created_at?: string;
  // Joined data
  socio?: Socio;
}

export type CausaSalida = 'ventas' | 'muerte' | 'robo';

export const causaSalidaLabels: Record<CausaSalida, string> = {
  ventas: 'Ventas',
  muerte: 'Muerte',
  robo: 'Robo'
};

export const tipoVentaLabels: Record<'venta' | 'muerte' | 'robo', string> = {
  venta: 'Venta',
  muerte: 'Muerte',
  robo: 'Robo'
};

// Helper functions for database operations
export const sociosService = {
  async getAll() {
    try {
      console.log('Fetching socios from Supabase...');
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      
      if (error) {
        console.error('Error fetching socios:', error.message, error.details);
        throw error;
      }
      console.log('Socios fetched successfully:', data?.length || 0);
      return data as Socio[];
    } catch (error) {
      console.error('Error in sociosService.getAll:', error);
      return [];
    }
  },

  async create(socio: Omit<Socio, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('socios')
      .insert([socio])
      .select()
      .single();
    
    if (error) throw error;
    return data as Socio;
  },

  async findByName(nombre: string) {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('nombre', nombre.toUpperCase())
      .eq('activo', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Socio | null;
  }
};

export const registrosService = {
  async getAll() {
    try {
      console.log('Fetching registros from Supabase...');
      // First try to get from registros_ganaderos (new table)
      const { data: registrosGanaderos, error: errorGanaderos } = await supabase
        .from('registros_ganaderos')
        .select(`
          *,
          socio:socios(*)
        `)
        .order('fecha', { ascending: false });
      
      if (!errorGanaderos && registrosGanaderos && registrosGanaderos.length > 0) {
        console.log('Registros ganaderos fetched successfully:', registrosGanaderos.length);
        return registrosGanaderos as RegistroGanadero[];
      }

      console.log('registros_ganaderos not available or empty, trying legacy table...');
      // Fallback to legacy registros table
      const { data: registrosLegacy, error: errorLegacy } = await supabase
        .from('registros')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (errorLegacy) {
        console.error('Error fetching registros:', errorLegacy.message, errorLegacy.details);
        throw errorLegacy;
      }

      console.log('Legacy registros fetched:', registrosLegacy?.length || 0);
      // Convert legacy format to new format
      const convertedRegistros: RegistroGanadero[] = [];
      
      if (registrosLegacy) {
        for (const registro of registrosLegacy) {
          // Find or create socio for this registro
          let socio = await sociosService.findByName(registro.socio);
          
          if (!socio) {
            socio = await sociosService.create({
              nombre: registro.socio,
              activo: true
            });
          }

          convertedRegistros.push({
            id: registro.id,
            socio_id: socio.id,
            fecha: registro.fecha,
            entradas: registro.entradas || 0,
            salidas: registro.salidas || 0,
            saldo: registro.saldo || 0,
            kg_totales: registro.kg_totales || 0,
            vr_kilo: registro.vr_kilo || 0,
            fletes: registro.fletes || 0,
            comision: registro.comision || 0,
            valor_animal: registro.valor_animal || 0,
            total: registro.total || 0,
            created_at: registro.created_at,
            updated_at: registro.updated_at,
            socio: socio
          });
        }
      }

      console.log('Converted registros:', convertedRegistros.length);
      return convertedRegistros;
    } catch (error) {
      console.error('Error in registrosService.getAll:', error);
      return [];
    }
  },

  async create(registro: Omit<RegistroGanadero, 'id' | 'created_at' | 'updated_at' | 'socio'>) {
    // Try to insert into registros_ganaderos first
    try {
      const { data, error } = await supabase
        .from('registros_ganaderos')
        .insert([registro])
        .select(`
          *,
          socio:socios(*)
        `)
        .single();
      
      if (!error) {
        return data as RegistroGanadero;
      }
    } catch (error) {
      console.log('registros_ganaderos table not available, using legacy table');
    }

    // Fallback to legacy registros table
    const socio = await supabase
      .from('socios')
      .select('*')
      .eq('id', registro.socio_id)
      .single();

    if (socio.error) throw socio.error;

    const legacyRegistro = {
      socio: socio.data.nombre,
      fecha: registro.fecha,
      entradas: registro.entradas,
      salidas: registro.salidas,
      saldo: registro.saldo,
      kg_totales: registro.kg_totales,
      vr_kilo: registro.vr_kilo,
      fletes: registro.fletes,
      comision: registro.comision,
      valor_animal: registro.valor_animal,
      total: registro.total
    };

    const { data, error } = await supabase
      .from('registros')
      .insert([legacyRegistro])
      .select()
      .single();
    
    if (error) throw error;

    return {
      ...data,
      socio_id: registro.socio_id,
      socio: socio.data
    } as RegistroGanadero;
  },

  async update(id: string, registro: Partial<RegistroGanadero>) {
    // Try registros_ganaderos first
    try {
      const { data, error } = await supabase
        .from('registros_ganaderos')
        .update(registro)
        .eq('id', id)
        .select(`
          *,
          socio:socios(*)
        `)
        .single();
      
      if (!error) {
        return data as RegistroGanadero;
      }
    } catch (error) {
      console.log('registros_ganaderos table not available, using legacy table');
    }

    // Fallback to legacy table
    if (registro.socio_id) {
      const socio = await supabase
        .from('socios')
        .select('*')
        .eq('id', registro.socio_id)
        .single();

      if (!socio.error) {
        const legacyUpdate = {
          ...registro,
          socio: socio.data.nombre
        };
        delete legacyUpdate.socio_id;

        const { data, error } = await supabase
          .from('registros')
          .update(legacyUpdate)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        return {
          ...data,
          socio_id: registro.socio_id,
          socio: socio.data
        } as RegistroGanadero;
      }
    }

    const { data, error } = await supabase
      .from('registros')
      .update(registro)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as RegistroGanadero;
  },

  async getBySocio(socioId: string) {
    try {
      const { data, error } = await supabase
        .from('registros_ganaderos')
        .select(`
          *,
          socio:socios(*)
        `)
        .eq('socio_id', socioId)
        .order('fecha', { ascending: false });
      
      if (!error) {
        return data as RegistroGanadero[];
      }
    } catch (error) {
      console.log('registros_ganaderos table not available, using legacy table');
    }

    // Fallback to legacy table
    const socio = await supabase
      .from('socios')
      .select('*')
      .eq('id', socioId)
      .single();

    if (socio.error) throw socio.error;

    const { data, error } = await supabase
      .from('registros')
      .select('*')
      .eq('socio', socio.data.nombre)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(registro => ({
      ...registro,
      socio_id: socioId,
      socio: socio.data
    })) as RegistroGanadero[];
  }
};

export const ventasService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          socio:socios(*)
        `)
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      return data as Venta[];
    } catch (error) {
      console.error('Error in ventasService.getAll:', error);
      return [];
    }
  },

  async create(venta: Omit<Venta, 'id' | 'created_at' | 'socio'>) {
    const { data, error } = await supabase
      .from('ventas')
      .insert([venta])
      .select(`
        *,
        socio:socios(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Venta;
  },

  async getBySocio(socioId: string) {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        socio:socios(*)
      `)
      .eq('socio_id', socioId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data as Venta[];
  },

  async getTotalVentasBySocio(socioId: string) {
    const { data, error } = await supabase
      .from('ventas')
      .select('valor_total')
      .eq('socio_id', socioId)
      .eq('tipo', 'venta');
    
    if (error) throw error;
    return (data || []).reduce((sum, venta) => sum + (venta.valor_total || 0), 0);
  }
};