import { effect, Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

/**
 * Gestiona el tema visual de la aplicacion. La eleccion se persiste en
 * localStorage y, a falta de eleccion previa, se respeta la preferencia
 * del sistema operativo (prefers-color-scheme).
 *
 * El tema activo se publica como atributo data-tema en <html>, y la hoja
 * de estilos global redefine las variables CSS en funcion de el.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private static readonly CLAVE_ALMACEN = 'mdshare-tema';

  readonly tema = signal<Tema>(this.temaInicial());

  constructor() {
    effect(() => {
      const tema = this.tema();
      document.documentElement.dataset['tema'] = tema;
      localStorage.setItem(TemaService.CLAVE_ALMACEN, tema);
    });
  }

  alternar(): void {
    this.tema.update((actual) => (actual === 'claro' ? 'oscuro' : 'claro'));
  }

  private temaInicial(): Tema {
    const guardado = localStorage.getItem(TemaService.CLAVE_ALMACEN);
    if (guardado === 'claro' || guardado === 'oscuro') {
      return guardado;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
}
