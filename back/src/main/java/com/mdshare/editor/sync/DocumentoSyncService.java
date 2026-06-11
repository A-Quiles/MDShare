package com.mdshare.editor.sync;

import com.mdshare.editor.documento.DocumentoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mantiene en memoria el último estado de cada documento en edición y lo vuelca
 * a Supabase (PostgreSQL) en lotes periódicos (throttling de escrituras).
 *
 * <p>De esta forma la base de datos no recibe una escritura por cada pulsación:
 * los cambios viajan por WebSockets y aquí solo se conserva el estado más reciente
 * por documento, que el scheduler persiste cada {@code app.sync.persist-interval-ms}.</p>
 */
@Service
public class DocumentoSyncService {

    private static final Logger log = LoggerFactory.getLogger(DocumentoSyncService.class);

    /** Último contenido conocido por documento, pendiente de persistir. */
    private final Map<UUID, String> cambiosPendientes = new ConcurrentHashMap<>();

    private final DocumentoRepository documentoRepository;

    public DocumentoSyncService(DocumentoRepository documentoRepository) {
        this.documentoRepository = documentoRepository;
    }

    /**
     * Registra el estado más reciente de un documento. Las llamadas sucesivas
     * sobrescriben el valor anterior: solo interesa el último estado.
     */
    public void registrarCambio(UUID documentoId, String contenidoMarkdown) {
        cambiosPendientes.put(documentoId, contenidoMarkdown);
    }

    /**
     * Vuelca a la base de datos los documentos modificados desde el último ciclo.
     * Se drena cada entrada con {@code remove}: si llega un cambio nuevo mientras
     * se persiste, queda registrado para el siguiente ciclo sin perderse.
     */
    @Scheduled(fixedDelayString = "${app.sync.persist-interval-ms:5000}")
    public void persistirCambiosPendientes() {
        if (cambiosPendientes.isEmpty()) {
            return;
        }

        for (UUID documentoId : cambiosPendientes.keySet()) {
            String contenido = cambiosPendientes.remove(documentoId);
            if (contenido == null) {
                continue;
            }

            documentoRepository.findById(documentoId).ifPresentOrElse(
                    documento -> {
                        documento.setContenido(contenido);
                        documento.setActualizadoEn(OffsetDateTime.now());
                        documentoRepository.save(documento);
                        log.debug("Documento {} persistido ({} caracteres)", documentoId, contenido.length());
                    },
                    () -> log.warn("Se descarta el cambio: el documento {} no existe en la base de datos", documentoId)
            );
        }
    }
}
