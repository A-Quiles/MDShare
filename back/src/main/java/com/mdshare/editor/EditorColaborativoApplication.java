package com.mdshare.editor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Punto de entrada del backend del Editor Markdown Colaborativo.
 *
 * {@code @EnableScheduling} activa el scheduler que persiste en Supabase,
 * cada pocos segundos, el estado en memoria de los documentos editados
 * (ver {@link com.mdshare.editor.sync.DocumentoSyncService}).
 */
@SpringBootApplication
@EnableScheduling
public class EditorColaborativoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EditorColaborativoApplication.class, args);
    }
}
