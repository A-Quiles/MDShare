import { inject, Injectable } from '@angular/core';
import DOMPurify from 'dompurify';

import { MarkdownService } from './markdown.service';

/**
 * Exportacion del documento: descarga como .md / .html, exportacion a PDF
 * (mediante el dialogo de impresion del navegador sobre el HTML renderizado,
 * sin dependencias pesadas) y copia al portapapeles.
 *
 * El HTML se genera con el mismo MarkdownService que la previsualizacion, de
 * modo que el documento exportado coincide con lo que el usuario ve en vivo.
 */
@Injectable({ providedIn: 'root' })
export class ExportacionService {
  private readonly markdown = inject(MarkdownService);

  descargarMarkdown(titulo: string, contenido: string): void {
    this.descargar(
      new Blob([contenido], { type: 'text/markdown;charset=utf-8' }),
      `${this.slug(titulo)}.md`,
    );
  }

  descargarHtml(titulo: string, contenido: string): void {
    this.descargar(
      new Blob([this.documentoHtml(titulo, contenido, false)], { type: 'text/html;charset=utf-8' }),
      `${this.slug(titulo)}.html`,
    );
  }

  /**
   * Abre el documento renderizado en una pestana nueva y lanza el dialogo de
   * impresion: "Guardar como PDF" produce un PDF fiel con la calidad nativa
   * del navegador (texto seleccionable, sin rasterizar).
   */
  exportarPdf(titulo: string, contenido: string): void {
    const html = this.documentoHtml(titulo, contenido, true);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    window.open(url, '_blank');
    // Margen amplio para que la pestana cargue antes de liberar el blob.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async copiar(contenido: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(contenido);
      return true;
    } catch {
      return false;
    }
  }

  /** Documento HTML autocontenido, con los mismos estilos de la previsualizacion. */
  private documentoHtml(titulo: string, markdown: string, autoImprimir: boolean): string {
    const cuerpo = this.markdown.render(markdown);
    const tituloSeguro = DOMPurify.sanitize(titulo);
    const scriptImpresion = autoImprimir
      ? '<script>window.addEventListener("load", () => window.print());</script>'
      : '';

    // Se redefinen los tokens de tema con una paleta clara: asi los estilos
    // compartidos (this.markdown.estilos) producen un documento legible e
    // independiente del tema activo en la app.
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${tituloSeguro}</title>
<style>
  :root {
    --texto: #1f2328; --texto-titulo: #0f172a; --texto-suave: #59636e;
    --borde: #d0d7de; --superficie-2: #f6f8fa; --primario: #0969da;
    --codigo-fondo: #0f172a; --codigo-texto: #e6edf3;
  }
  body {
    max-width: 820px; margin: 2.5rem auto; padding: 0 1.5rem;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 16px;
    color: var(--texto);
  }
  ${this.markdown.estilos}
  @media print {
    body { margin: 0; max-width: none; }
    .md pre, .md .md-tabla, .md blockquote, .md img { break-inside: avoid; }
  }
</style>
${scriptImpresion}
</head>
<body>
<main class="md">${cuerpo}</main>
</body>
</html>`;
  }

  private descargar(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private slug(titulo: string): string {
    const limpio = titulo
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // diacriticos sueltos tras normalize NFD
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return limpio || 'documento';
  }
}
