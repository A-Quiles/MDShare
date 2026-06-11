package com.mdshare.editor.documento;

import com.mdshare.editor.documento.dto.ColaboradorResponse;
import com.mdshare.editor.documento.dto.CrearDocumentoRequest;
import com.mdshare.editor.documento.dto.DocumentoResponse;
import com.mdshare.editor.documento.dto.InvitarColaboradorRequest;
import com.mdshare.editor.seguridad.UsuarioActual;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * API REST de documentos con privacidad por propietario.
 *
 * <p>La identidad del solicitante llega en las cabeceras {@code X-Usuario-Id} y
 * {@code X-Usuario-Email}, inyectadas por el interceptor HTTP de Angular con los
 * datos de la sesion de Supabase. Si faltan, Spring responde 400 automaticamente.</p>
 */
@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {

    private final DocumentoService documentoService;

    public DocumentoController(DocumentoService documentoService) {
        this.documentoService = documentoService;
    }

    @GetMapping
    public List<DocumentoResponse> listar(@RequestHeader("X-Usuario-Id") UUID usuarioId,
                                          @RequestHeader("X-Usuario-Email") String email) {
        return documentoService.listar(new UsuarioActual(usuarioId, email));
    }

    @GetMapping("/{id}")
    public DocumentoResponse obtener(@PathVariable UUID id,
                                     @RequestHeader("X-Usuario-Id") UUID usuarioId,
                                     @RequestHeader("X-Usuario-Email") String email) {
        return documentoService.obtener(id, new UsuarioActual(usuarioId, email));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentoResponse crear(@Valid @RequestBody CrearDocumentoRequest request,
                                   @RequestHeader("X-Usuario-Id") UUID usuarioId,
                                   @RequestHeader("X-Usuario-Email") String email) {
        return documentoService.crear(request, new UsuarioActual(usuarioId, email));
    }

    @GetMapping("/{id}/colaboradores")
    public List<ColaboradorResponse> listarColaboradores(@PathVariable UUID id,
                                                         @RequestHeader("X-Usuario-Id") UUID usuarioId,
                                                         @RequestHeader("X-Usuario-Email") String email) {
        return documentoService.listarColaboradores(id, new UsuarioActual(usuarioId, email));
    }

    @PostMapping("/{id}/colaboradores")
    @ResponseStatus(HttpStatus.CREATED)
    public ColaboradorResponse invitarColaborador(@PathVariable UUID id,
                                                  @Valid @RequestBody InvitarColaboradorRequest request,
                                                  @RequestHeader("X-Usuario-Id") UUID usuarioId,
                                                  @RequestHeader("X-Usuario-Email") String email) {
        return documentoService.invitarColaborador(id, request.email(), new UsuarioActual(usuarioId, email));
    }

    @DeleteMapping("/{id}/colaboradores/{emailColaborador}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarColaborador(@PathVariable UUID id,
                                    @PathVariable String emailColaborador,
                                    @RequestHeader("X-Usuario-Id") UUID usuarioId,
                                    @RequestHeader("X-Usuario-Email") String email) {
        documentoService.eliminarColaborador(id, emailColaborador, new UsuarioActual(usuarioId, email));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarDocumento(@PathVariable UUID id,
                                  @RequestHeader("X-Usuario-Id") UUID usuarioId,
                                  @RequestHeader("X-Usuario-Email") String email) {
        documentoService.eliminarDocumento(id, new UsuarioActual(usuarioId, email));
    }
}
