import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { MarkdownService } from '../../core/services/markdown.service';

/**
 * Previsualizacion en vivo del Markdown. La conversion y el saneado viven en
 * MarkdownService (mismo pipeline que la exportacion); aqui solo se enlaza el
 * resultado al DOM y se aporta el contenedor con scroll.
 *
 * El HTML se inyecta via [innerHTML], por lo que sus estilos no pueden ir en
 * este componente (la encapsulacion de Angular no alcanza ese contenido): los
 * publica MarkdownService como hoja global bajo la clase `.md`.
 */
@Component({
  selector: 'app-markdown-preview',
  template: '<div class="previsualizacion md" [innerHTML]="html()"></div>',
  styles: `
    .previsualizacion {
      padding: 1.25rem 1.4rem;
      font-size: 0.95rem;
    }
  `,
})
export class MarkdownPreviewComponent {
  readonly markdown = input<string>('');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly markdownService = inject(MarkdownService);

  protected readonly html = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.markdownService.render(this.markdown())),
  );
}
