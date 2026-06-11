import { Injectable } from '@angular/core';
import {
  AuthResponse,
  createClient,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * Capa de autenticacion: Angular habla directamente con Supabase Auth
 * mediante el SDK oficial. El backend de Spring Boot no interviene en el login;
 * solo comparte la misma base de datos PostgreSQL.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly client: SupabaseClient;

  private readonly sessionSubject = new BehaviorSubject<Session | null>(null);
  /** Sesion activa (o null). Emite en login, logout y refresco de token. */
  readonly session$: Observable<Session | null> = this.sessionSubject.asObservable();

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

    // Mantiene el BehaviorSubject sincronizado con el estado real de Supabase Auth.
    this.client.auth.onAuthStateChange((_evento, session) => {
      this.sessionSubject.next(session);
    });
  }

  get session(): Session | null {
    return this.sessionSubject.value;
  }

  /** Email del usuario autenticado, o null si no hay sesion. */
  get emailUsuario(): string | null {
    return this.session?.user.email ?? null;
  }

  /** Id (auth.users.id) del usuario autenticado, o null si no hay sesion. */
  get idUsuario(): string | null {
    return this.session?.user.id ?? null;
  }

  /**
   * Recupera la sesion persistida (localStorage) directamente del SDK.
   * La usa el guard de rutas, que necesita esperar a la carga inicial.
   */
  async obtenerSesion(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  iniciarSesion(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  registrarse(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signUp({ email, password });
  }

  async cerrarSesion(): Promise<void> {
    await this.client.auth.signOut();
  }
}
