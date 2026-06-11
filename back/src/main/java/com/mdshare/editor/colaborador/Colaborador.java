package com.mdshare.editor.colaborador;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

/**
 * Invitacion de colaboracion sobre un documento. El propietario no se registra
 * aqui: su acceso es implicito a traves de documentos.creado_por.
 */
@Entity
@Table(name = "documento_colaboradores")
public class Colaborador {

    @EmbeddedId
    private ColaboradorId id;

    @Column(name = "invitado_en", nullable = false)
    private OffsetDateTime invitadoEn = OffsetDateTime.now();

    protected Colaborador() {
        // Requerido por JPA
    }

    public Colaborador(ColaboradorId id) {
        this.id = id;
    }

    public ColaboradorId getId() {
        return id;
    }

    public OffsetDateTime getInvitadoEn() {
        return invitadoEn;
    }
}
