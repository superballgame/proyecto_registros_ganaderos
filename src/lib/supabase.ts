import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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

export interface SalidaDetalle {
  id: string;
  registro_id: string;
  socio: string;
  fecha: string;
  cantidad: number;
  causa: 'ventas' | 'muerte' | 'robo';
  created_at?: string;
}

export type CausaSalida = 'ventas' | 'muerte' | 'robo';

export const causaSalidaLabels: Record<CausaSalida, string> = {
  ventas: 'Ventas',
  muerte: 'Muerte',
  robo: 'Robo'
};

// Helper functions for database operations
export const sociosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    
    if (error) throw error;
    return data as Socio[];
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
    const { data, error } = await supabase
      .from('registros_ganaderos')
      .select(`
        *,
        socio:socios(*)
      `)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data as RegistroGanadero[];
  },

  async create(registro: Omit<RegistroGanadero, 'id' | 'created_at' | 'updated_at' | 'socio'>) {
    const { data, error } = await supabase
      .from('registros_ganaderos')
      .insert([registro])
      .select(`
        *,
        socio:socios(*)
      `)
      .single();
    
    if (error) throw error;
    return data as RegistroGanadero;
  },

  async update(id: string, registro: Partial<RegistroGanadero>) {
    const { data, error } = await supabase
      .from('registros_ganaderos')
      .update(registro)
      .eq('id', id)
      .select(`
        *,
        socio:socios(*)
      `)
      .single();
    
    if (error) throw error;
    return data as RegistroGanadero;
  },

  async getBySocio(socioId: string) {
    const { data, error } = await supabase
      .from('registros_ganaderos')
      .select(`
        *,
        socio:socios(*)
      `)
      .eq('socio_id', socioId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data as RegistroGanadero[];
  }
};