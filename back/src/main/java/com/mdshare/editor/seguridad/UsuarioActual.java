package com.mdshare.editor.seguridad;

import java.util.Locale;
import java.util.UUID;

/**
 * Identidad del usuario que hace la peticion, extraida de las cabeceras
 * X-Usuario-Id / X-Usuario-Email que envia el interceptor de Angular con los
 * datos de la sesion de Supabase Auth.
 *
 * <p>Nota de arquitectura: esto cubre la privacidad funcional. El endurecimiento
 * de produccion (que un cliente no pueda falsear las cabeceras) consiste en
 * validar el JWT de Supabase con spring-boot-starter-oauth2-resource-server y
 * derivar la identidad del token; esta en el roadmap del README.</p>
 */
public record UsuarioActual(UUID id, String email) {

    public UsuarioActual {
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
