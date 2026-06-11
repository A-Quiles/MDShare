import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SupabaseService } from '../services/supabase.service';

/**
 * Adjunta la identidad de la sesion de Supabase (id y email) a cada peticion
 * dirigida a la API de Spring Boot, que la usa para aplicar la privacidad de
 * los documentos. Las peticiones a otros origenes (p. ej. Supabase) no se tocan.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const supabase = inject(SupabaseService);

  return from(supabase.obtenerSesion()).pipe(
    switchMap((session) => {
      if (!session) {
        return next(req);
      }
      return next(
        req.clone({
          setHeaders: {
            'X-Usuario-Id': session.user.id,
            'X-Usuario-Email': session.user.email ?? '',
          },
        }),
      );
    }),
  );
};
