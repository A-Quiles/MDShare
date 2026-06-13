import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';

/**
 * Pipeline unico de Markdown -> HTML para toda la app (previsualizacion y
 * exportacion comparten esta instancia, asi lo que ves es lo que exportas).
 *
 * Responsabilidades:
 *  - Parsear con `marked` (GFM: tablas, tachado, listas de tareas, autolinks).
 *  - Resaltar la sintaxis de los bloques de codigo con highlight.js.
 *  - Sanitizar con DOMPurify: el contenido procede de otros usuarios, asi que
 *    nunca se confia en el sin limpiar (prevencion de XSS).
 *  - Publicar los estilos del Markdown renderizado como una hoja global, para
 *    que alcancen tambien al contenido inyectado via [innerHTML] (la
 *    encapsulacion de componentes de Angular no llega a ese HTML).
 */
@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private static readonly ID_ESTILOS = 'mdshare-markdown-estilos';

  private readonly documento = inject(DOCUMENT);
  private readonly marked: Marked;

  constructor() {
    this.marked = new Marked(
      markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight: (codigo, lenguaje) => {
          const idioma = lenguaje && hljs.getLanguage(lenguaje) ? lenguaje : 'plaintext';
          return hljs.highlight(codigo, { language: idioma }).value;
        },
      }),
    );
    this.marked.setOptions({ gfm: true, breaks: true });

    // Enlaces externos: abrir en pestana nueva y blindar contra tabnabbing.
    DOMPurify.addHook('afterSanitizeAttributes', (nodo) => {
      if (nodo.nodeName !== 'A') {
        return;
      }
      const enlace = nodo as Element;
      if (/^https?:/i.test(enlace.getAttribute('href') ?? '')) {
        enlace.setAttribute('target', '_blank');
        enlace.setAttribute('rel', 'noopener noreferrer');
      }
    });

    this.inyectarEstilos();
  }

  /** Convierte Markdown en HTML seguro listo para inyectar como innerHTML. */
  render(markdown: string): string {
    const crudo = this.marked.parse(markdown ?? '', { async: false }) as string;
    const seguro = DOMPurify.sanitize(crudo);
    // Envolver cada tabla en un contenedor con scroll horizontal: evita que una
    // tabla ancha desborde el panel y rompa el layout en pantallas pequenas.
    return seguro
      .replace(/<table>/g, '<div class="md-tabla"><table>')
      .replace(/<\/table>/g, '</table></div>');
  }

  /** Hoja de estilos del Markdown renderizado (la reutiliza la exportacion). */
  get estilos(): string {
    return MarkdownService.CSS;
  }

  /** Inserta los estilos como hoja global una sola vez (idempotente). */
  private inyectarEstilos(): void {
    const doc = this.documento;
    if (!doc?.head || doc.getElementById(MarkdownService.ID_ESTILOS)) {
      return;
    }
    const estilo = doc.createElement('style');
    estilo.id = MarkdownService.ID_ESTILOS;
    estilo.textContent = MarkdownService.CSS;
    doc.head.appendChild(estilo);
  }

  /**
   * Estilos del contenido Markdown, todo bajo `.md`. Usa los tokens de tema
   * (var(--...)) para integrarse con el modo claro/oscuro; la exportacion los
   * redefine con valores claros para producir un documento autonomo.
   * Los colores de la sintaxis (`.hljs-*`) son fijos porque el fondo del
   * codigo es oscuro en ambos temas.
   */
  private static readonly CSS = `
.md { color: var(--texto); line-height: 1.7; overflow-wrap: break-word; }
.md > :first-child { margin-top: 0; }
.md > :last-child { margin-bottom: 0; }
.md h1, .md h2, .md h3, .md h4, .md h5, .md h6 {
  color: var(--texto-titulo); line-height: 1.3; margin: 1.5em 0 0.6em; font-weight: 600;
}
.md h1 { font-size: 1.8em; padding-bottom: 0.3em; border-bottom: 1px solid var(--borde); }
.md h2 { font-size: 1.45em; padding-bottom: 0.25em; border-bottom: 1px solid var(--borde); }
.md h3 { font-size: 1.2em; }
.md h4 { font-size: 1.05em; }
.md p { margin: 0.75em 0; }
.md a { color: var(--primario); text-decoration: none; }
.md a:hover { text-decoration: underline; }
.md strong { color: var(--texto-titulo); }
.md ul, .md ol { padding-left: 1.6em; margin: 0.75em 0; }
.md li { margin: 0.3em 0; }
.md li::marker { color: var(--texto-suave); }
.md li:has(> input[type=checkbox]) { list-style: none; }
.md li > input[type=checkbox] { margin: 0 0.5em 0 -1.4em; vertical-align: middle; }
.md blockquote {
  margin: 1em 0; padding: 0.4em 1em; color: var(--texto-suave);
  border-left: 4px solid var(--primario); background: var(--superficie-2); border-radius: 0 8px 8px 0;
}
.md blockquote > :first-child { margin-top: 0; }
.md blockquote > :last-child { margin-bottom: 0; }
.md hr { border: 0; border-top: 1px solid var(--borde); margin: 1.6em 0; }
.md img { max-width: 100%; border-radius: 8px; }
.md kbd {
  font-family: inherit; font-size: 0.85em; padding: 0.1em 0.45em;
  border: 1px solid var(--borde); border-bottom-width: 2px; border-radius: 5px; background: var(--superficie-2);
}
.md code { font-family: 'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace; font-size: 0.88em; }
.md :not(pre) > code {
  background: var(--superficie-2); border: 1px solid var(--borde);
  border-radius: 5px; padding: 0.12em 0.4em;
}
.md pre {
  margin: 1em 0; padding: 1rem 1.15rem; overflow-x: auto; line-height: 1.55;
  background: var(--codigo-fondo); color: var(--codigo-texto);
  border: 1px solid var(--borde); border-radius: 10px;
}
.md pre code { display: block; padding: 0; background: none; border: 0; font-size: 0.85em; color: inherit; }
.md .md-tabla { overflow-x: auto; margin: 1em 0; border: 1px solid var(--borde); border-radius: 10px; }
.md table { border-collapse: collapse; width: 100%; font-size: 0.95em; }
.md th, .md td { padding: 0.55rem 0.85rem; border: 1px solid var(--borde); text-align: left; vertical-align: top; }
.md thead th { background: var(--superficie-2); color: var(--texto-titulo); font-weight: 600; }
.md tbody tr:nth-child(even) { background: var(--superficie-2); }
.md th[align=center], .md td[align=center] { text-align: center; }
.md th[align=right], .md td[align=right] { text-align: right; }
.md .md-tabla > table { border: 0; }
.md .md-tabla th:first-child, .md .md-tabla td:first-child { border-left: 0; }
.md .md-tabla th:last-child, .md .md-tabla td:last-child { border-right: 0; }
.md .md-tabla tr:first-child th, .md .md-tabla tr:first-child td { border-top: 0; }
.md .hljs-comment, .md .hljs-quote { color: #8b949e; font-style: italic; }
.md .hljs-keyword, .md .hljs-selector-tag, .md .hljs-built_in, .md .hljs-name, .md .hljs-tag { color: #ff7b72; }
.md .hljs-string, .md .hljs-doctag, .md .hljs-template-string, .md .hljs-regexp, .md .hljs-addition { color: #a5d6ff; }
.md .hljs-title, .md .hljs-section, .md .hljs-title.function_ { color: #d2a8ff; }
.md .hljs-attr, .md .hljs-attribute, .md .hljs-variable, .md .hljs-template-variable, .md .hljs-class .hljs-title, .md .hljs-type, .md .hljs-number, .md .hljs-literal, .md .hljs-params { color: #79c0ff; }
.md .hljs-symbol, .md .hljs-bullet, .md .hljs-link, .md .hljs-meta, .md .hljs-selector-id, .md .hljs-selector-class { color: #ffa657; }
.md .hljs-emphasis { font-style: italic; }
.md .hljs-strong { font-weight: 600; }
.md .hljs-deletion { color: #ffdcd7; }
`;
}
