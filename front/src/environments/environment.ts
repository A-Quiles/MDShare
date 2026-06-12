/**
 * Configuracion de produccion. Sustituye los valores por los de tu despliegue real.
 * La anon key de Supabase es publica por diseno: la seguridad de los datos
 * accedidos via SDK la imponen las politicas RLS de Supabase.
 */
export const environment = {
  production: true,
  supabaseUrl: 'https://ikojdkwkqxflweosedua.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrb2pka3drcXhmbHdlb3NlZHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTE1MDIsImV4cCI6MjA5NjcyNzUwMn0.VilENgSx3cx0ONjbdXH-K93Qwf6rOahD5EjI1-BgiNs',
  apiUrl: 'https://mdshare-1.onrender.com/api',
  wsUrl: 'https://mdshare-1.onrender.com/ws-collaborative',
} as const;
