package com.mdshare.editor.documento.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Peticion de creacion de un documento. El propietario no viaja en el body:
 * se toma de la identidad de la peticion (cabeceras X-Usuario-*).
 *
 * @param titulo nombre del archivo Markdown
 */
public record CrearDocumentoRequest(
        @NotBlank @Size(max = 255) String titulo
) {
}
