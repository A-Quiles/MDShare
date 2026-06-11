package com.mdshare.editor.documento.dto;

import com.mdshare.editor.colaborador.Colaborador;

import java.time.OffsetDateTime;

/**
 * Colaborador invitado a un documento, tal y como lo expone la API REST.
 */
public record ColaboradorResponse(String email, OffsetDateTime invitadoEn) {

    public static ColaboradorResponse from(Colaborador colaborador) {
        return new ColaboradorResponse(colaborador.getId().getEmail(), colaborador.getInvitadoEn());
    }
}
