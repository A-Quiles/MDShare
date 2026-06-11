package com.mdshare.editor.documento.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Peticion del propietario para invitar a un colaborador por email.
 */
public record InvitarColaboradorRequest(
        @NotBlank @Email @Size(max = 320) String email
) {
}
