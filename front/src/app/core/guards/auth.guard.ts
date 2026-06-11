import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SupabaseService } from '../services/supabase.service';

/**
 * Protege las rutas del editor: sin sesion de Supabase se redirige a /login.
 * Es asincrono porque en el arranque la sesion persistida aun puede estar
 * cargandose desde localStorage.
 */
export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const session = await supabase.obtenerSesion();
  return session ? true : router.createUrlTree(['/login']);
};
