/**
 * Configuracion de desarrollo (ng serve la usa por defecto via fileReplacements).
 *
 * 1. supabaseUrl / supabaseAnonKey: Dashboard de Supabase > Project Settings > API.
 * 2. wsUrl apunta al endpoint SockJS registrado en WebSocketConfig (Spring Boot),
 *    por eso es http:// y no ws:// (SockJS negocia el transporte sobre HTTP).
 */
export const environment = {
  production: false,
  supabaseUrl: 'https://ikojdkwkqxflweosedua.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrb2pka3drcXhmbHdlb3NlZHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTE1MDIsImV4cCI6MjA5NjcyNzUwMn0.VilENgSx3cx0ONjbdXH-K93Qwf6rOahD5EjI1-BgiNs',
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'http://localhost:8080/ws-collaborative',
} as const;
