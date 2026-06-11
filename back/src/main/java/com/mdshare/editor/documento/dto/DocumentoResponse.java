package com.mdshare.editor.documento.dto;

import com.mdshare.editor.documento.Documento;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Representacion de un documento expuesta por la API REST.
 * Incluye el propietario para que el frontend sepa si debe mostrar
 * las acciones de gestion (invitar colaboradores).
 */
public record DocumentoResponse(
        UUID id,
        String titulo,
        String contenido,
        UUID creadoPor,
        OffsetDateTime actualizadoEn
) {

    public static DocumentoResponse from(Documento documento) {
        return new DocumentoResponse(
                documento.getId(),
                documento.getTitulo(),
                documento.getContenido(),
                documento.getCreadoPor(),
                documento.getActualizadoEn()
        );
    }
}
