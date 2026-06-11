import { Component, inject } from '@angular/core';

import { TemaService } from '../core/services/tema.service';

/**
 * Conmutador de tema claro/oscuro, reutilizado en todas las cabeceras.
 */
@Component({
  selector: 'app-boton-tema',
  template: `
    <button
      type="button"
      class="conmutador"
      (click)="tema.alternar()"
      [title]="tema.tema() === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
    >
      {{ tema.tema() === 'oscuro' ? '☀️' : '🌙' }}
    </button>
  `,
  styles: `
    .conmutador {
      width: 2.3rem;
      height: 2.3rem;
      display: grid;
      place-items: center;
      border: 1px solid var(--borde);
      border-radius: 999px;
      background: var(--superficie);
      font-size: 0.95rem;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease;

      &:hover {
        transform: scale(1.08);
        border-color: var(--primario);
      }
    }
  `,
})
export class BotonTemaComponent {
  protected readonly tema = inject(TemaService);
}
