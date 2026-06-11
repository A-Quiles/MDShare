/**
 * Payload que viaja por el canal STOMP en ambas direcciones.
 * Debe coincidir con el record CambioDocumentoDTO de Spring Boot.
 */
export interface CambioDocumento {
  readonly documentoId: string;
  readonly usuario: string;
  readonly contenidoMarkdown: string;
  readonly posicionCursor: number;
}
