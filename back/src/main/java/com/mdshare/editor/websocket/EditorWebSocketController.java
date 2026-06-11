package com.mdshare.editor.websocket;

import com.mdshare.editor.sync.DocumentoSyncService;
import com.mdshare.editor.websocket.dto.CambioDocumentoDTO;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * Controlador de mensajería STOMP del editor colaborativo.
 *
 * <p>Flujo: Angular publica en {@code /app/editor.cambio/{salaCodigo}} y este método
 * retransmite el cambio, sin tocar la base de datos, a todos los clientes suscritos a
 * {@code /topic/sala/{salaCodigo}}. En paralelo registra el último estado del documento
 * en memoria para que el scheduler lo persista en Supabase de forma diferida.</p>
 */
@Controller
public class EditorWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(EditorWebSocketController.class);

    private final DocumentoSyncService documentoSyncService;

    public EditorWebSocketController(DocumentoSyncService documentoSyncService) {
        this.documentoSyncService = documentoSyncService;
    }

    @MessageMapping("/editor.cambio/{salaCodigo}")
    @SendTo("/topic/sala/{salaCodigo}")
    public CambioDocumentoDTO difundirCambio(@DestinationVariable String salaCodigo,
                                             @Valid @Payload CambioDocumentoDTO cambio) {
        log.debug("Cambio recibido en sala {} de {} ({} caracteres)",
                salaCodigo, cambio.usuario(), cambio.contenidoMarkdown().length());

        // Registra el último estado en memoria; la persistencia en Supabase es diferida.
        documentoSyncService.registrarCambio(cambio.documentoId(), cambio.contenidoMarkdown());

        // El valor devuelto se difunde tal cual a /topic/sala/{salaCodigo}.
        return cambio;
    }
}
