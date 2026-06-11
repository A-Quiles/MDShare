package com.mdshare.editor.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuración del canal de tiempo real (STOMP sobre WebSockets con fallback SockJS).
 *
 * <ul>
 *   <li><b>/topic</b>: prefijo de los destinos gestionados por el broker simple en memoria.
 *       Los clientes se suscriben a {@code /topic/sala/{salaCodigo}} para recibir cambios.</li>
 *   <li><b>/app</b>: prefijo de los mensajes dirigidos a métodos {@code @MessageMapping}
 *       de la aplicación (p. ej. {@code /app/editor.cambio/{salaCodigo}}).</li>
 *   <li><b>/ws-collaborative</b>: endpoint HTTP de handshake al que se conecta Angular.
 *       SockJS proporciona fallback (xhr-streaming, xhr-polling) si la red del cliente
 *       bloquea los WebSockets nativos.</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final String[] allowedOrigins;

    public WebSocketConfig(@Value("${app.cors.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Broker simple en memoria: retransmite los mensajes a todos los suscriptores del topic.
        config.enableSimpleBroker("/topic");
        // Prefijo de los mensajes que enrutan hacia los @MessageMapping de los controladores.
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-collaborative")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();
    }
}
