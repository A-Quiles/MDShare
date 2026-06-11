/**
 * Configuracion de produccion. Sustituye los valores por los de tu despliegue real.
 * La anon key de Supabase es publica por diseno: la seguridad de los datos
 * accedidos via SDK la imponen las politicas RLS de Supabase.
 */
export const environment = {
  production: true,
  supabaseUrl: 'https://TU-PROJECT-REF.supabase.co',
  supabaseAnonKey: 'TU_SUPABASE_ANON_KEY',
  apiUrl: 'https://tu-backend.example.com/api',
  wsUrl: 'https://tu-backend.example.com/ws-collaborative',
} as const;
