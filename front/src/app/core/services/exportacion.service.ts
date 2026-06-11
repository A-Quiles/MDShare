import { Injectable } from '@angular/core';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Exportacion del documento: descarga como .md / .html, exportacion a PDF
 * (mediante el dialogo de impresion del navegador sobre el HTML renderizado,
 * sin dependencias pesadas) y copia al portapapeles.
 */
@Injectable({ providedIn: 'root' })
export class ExportacionService {
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

  /** Markdown -> HTML sanitizado (mismo pipeline que la previsualizacion). */
  private renderizar(markdown: string): string {
    return DOMPurify.sanitize(marked.parse(markdown, { async: false }));
  }

  /** Documento HTML autocontenido, con estilos tipograficos embebidos. */
  private documentoHtml(titulo: string, markdown: string, autoImprimir: boolean): string {
    const cuerpo = this.renderizar(markdown);
    const tituloSeguro = DOMPurify.sanitize(titulo);
    const scriptImpresion = autoImprimir
      ? '<script>window.addEventListener("load", () => window.print());</script>'
      : '';

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${tituloSeguro}</title>
<style>
  body {
    max-width: 760px;
    margin: 2.5rem auto;
    padding: 0 1.5rem;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: #1e293b;
  }
  h1, h2, h3, h4 { color: #0f172a; line-height: 1.3; }
  h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: .4rem; }
  pre {
    background: #0f172a; color: #e2e8f0;
    padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 13px;
  }
  code { font-family: Consolas, 'Cascadia Code', monospace; }
  p > code, li > code { background: #f1f5f9; padding: .1rem .35rem; border-radius: 4px; }
  blockquote { border-left: 4px solid #2563eb; margin-left: 0; padding-left: 1rem; color: #475569; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #cbd5e1; padding: .4rem .75rem; }
  img { max-width: 100%; }
  @media print { body { margin: 0; max-width: none; } }
</style>
${scriptImpresion}
</head>
<body>
${cuerpo}
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
