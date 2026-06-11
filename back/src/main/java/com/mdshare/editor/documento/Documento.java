package com.mdshare.editor.documento;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Documento Markdown persistido en la tabla {@code documentos} de Supabase (PostgreSQL).
 * Refleja el esquema definido en {@code supabase/schema.sql}.
 */
@Entity
@Table(name = "documentos")
public class Documento {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "text", nullable = false)
    private String contenido = "";

    /** Usuario propietario: referencia al id de auth.users gestionado por Supabase Auth. */
    @Column(name = "creado_por")
    private UUID creadoPor;

    @Column(name = "actualizado_en", nullable = false)
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();

    protected Documento() {
        // Requerido por JPA
    }

    public Documento(String titulo, UUID creadoPor) {
        this.titulo = titulo;
        this.creadoPor = creadoPor;
    }

    public UUID getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    public UUID getCreadoPor() {
        return creadoPor;
    }

    public void setCreadoPor(UUID creadoPor) {
        this.creadoPor = creadoPor;
    }

    public OffsetDateTime getActualizadoEn() {
        return actualizadoEn;
    }

    public void setActualizadoEn(OffsetDateTime actualizadoEn) {
        this.actualizadoEn = actualizadoEn;
    }
}
