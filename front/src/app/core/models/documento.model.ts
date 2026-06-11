/**
 * Documento persistido, tal y como lo expone la API REST de Spring Boot
 * (record DocumentoResponse).
 */
export interface Documento {
  readonly id: string;
  readonly titulo: string;
  readonly contenido: string;
  readonly creadoPor: string | null;
  readonly actualizadoEn: string;
}

export interface CrearDocumentoRequest {
  readonly titulo: string;
}

/** Invitacion de colaboracion sobre un documento. */
export interface Colaborador {
  readonly email: string;
  readonly invitadoEn: string;
}
