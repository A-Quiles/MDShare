import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Previsualizacion en vivo: convierte el Markdown a HTML con `marked` y lo
 * sanitiza con DOMPurify antes de inyectarlo (el contenido procede de otros
 * usuarios, asi que nunca se confia en el sin limpiar: prevencion de XSS).
 */
@Component({
  selector: 'app-markdown-preview',
  template: '<div class="previsualizacion" [innerHTML]="html()"></div>',
  styles: `
    .previsualizacion {
      padding: 1.1rem 1.25rem;
      font-size: 0.95rem;
      line-height: 1.65;
      color: var(--texto);

      h1, h2, h3 {
        color: var(--texto-titulo);
      }

      h1 {
        border-bottom: 1px solid var(--borde);
        padding-bottom: 0.35rem;
      }

      a {
        color: var(--primario);
      }

      pre {
        background: var(--codigo-fondo);
        color: var(--codigo-texto);
        padding: 0.85rem 1rem;
        border-radius: 8px;
        overflow-x: auto;
      }

      code {
        font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
        font-size: 0.85em;
      }

      p > code,
      li > code {
        background: var(--superficie-2);
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
      }

      blockquote {
        border-left: 4px solid var(--primario);
        margin-left: 0;
        padding-left: 1rem;
        color: var(--texto-suave);
      }

      table {
        border-collapse: collapse;

        th, td {
          border: 1px solid var(--borde);
          padding: 0.4rem 0.75rem;
        }
      }

      img {
        max-width: 100%;
      }

      hr {
        border: none;
        border-top: 1px solid var(--borde);
      }
    }
  `,
})
export class MarkdownPreviewComponent {
  readonly markdown = input<string>('');

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly html = computed<SafeHtml>(() => {
    const htmlCrudo = marked.parse(this.markdown(), { async: false });
    const htmlSeguro = DOMPurify.sanitize(htmlCrudo);
    return this.sanitizer.bypassSecurityTrustHtml(htmlSeguro);
  });
}
