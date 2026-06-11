package com.mdshare.editor.colaborador;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Clave compuesta de la tabla documento_colaboradores: un email solo puede
 * estar invitado una vez a cada documento.
 */
@Embeddable
public class ColaboradorId implements Serializable {

    @Column(name = "documento_id")
    private UUID documentoId;

    @Column(name = "email", length = 320)
    private String email;

    protected ColaboradorId() {
        // Requerido por JPA
    }

    public ColaboradorId(UUID documentoId, String email) {
        this.documentoId = documentoId;
        this.email = email;
    }

    public UUID getDocumentoId() {
        return documentoId;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ColaboradorId otro)) {
            return false;
        }
        return Objects.equals(documentoId, otro.documentoId)
                && Objects.equals(email, otro.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(documentoId, email);
    }
}
