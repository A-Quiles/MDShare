package com.mdshare.editor.websocket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.UUID;

/**
 * Payload que viaja por el canal STOMP cada vez que un usuario modifica el documento.
 *
 * <p>Es un mensaje volátil: se difunde a todos los suscriptores de la sala de forma
 * inmediata y solo se persiste en Supabase de forma diferida (cada pocos segundos)
 * a través de {@link com.mdshare.editor.sync.DocumentoSyncService}.</p>
 *
 * @param documentoId       identificador del documento que se está editando
 * @param usuario           identidad del emisor (se usa en el cliente para descartar el eco propio)
 * @param contenidoMarkdown estado completo actual del texto en Markdown
 * @param posicionCursor    posición del cursor del emisor dentro del texto
 */
public record CambioDocumentoDTO(
        @NotNull UUID documentoId,
        @NotBlank String usuario,
        @NotNull String contenidoMarkdown,
        @PositiveOrZero int posicionCursor
) {
}
