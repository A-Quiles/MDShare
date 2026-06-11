package com.mdshare.editor.documento;

import com.mdshare.editor.colaborador.Colaborador;
import com.mdshare.editor.colaborador.ColaboradorId;
import com.mdshare.editor.colaborador.ColaboradorRepository;
import com.mdshare.editor.documento.dto.ColaboradorResponse;
import com.mdshare.editor.documento.dto.CrearDocumentoRequest;
import com.mdshare.editor.documento.dto.DocumentoResponse;
import com.mdshare.editor.seguridad.UsuarioActual;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Operaciones sobre documentos con control de acceso: un documento es privado
 * de su propietario hasta que este invita a colaboradores por email.
 * La edicion en vivo viaja por WebSockets; aqui solo la carga inicial y gestion.
 */
@Service
public class DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final ColaboradorRepository colaboradorRepository;

    public DocumentoService(DocumentoRepository documentoRepository,
                            ColaboradorRepository colaboradorRepository) {
        this.documentoRepository = documentoRepository;
        this.colaboradorRepository = colaboradorRepository;
    }

    @Transactional(readOnly = true)
    public List<DocumentoResponse> listar(UsuarioActual usuario) {
        return documentoRepository.findAccesiblesPara(usuario.id(), usuario.email()).stream()
                .map(DocumentoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentoResponse obtener(UUID id, UsuarioActual usuario) {
        Documento documento = buscarConAcceso(id, usuario);
        return DocumentoResponse.from(documento);
    }

    @Transactional
    public DocumentoResponse crear(CrearDocumentoRequest request, UsuarioActual usuario) {
        Documento documento = new Documento(request.titulo(), usuario.id());
        return DocumentoResponse.from(documentoRepository.save(documento));
    }

    @Transactional(readOnly = true)
    public List<ColaboradorResponse> listarColaboradores(UUID documentoId, UsuarioActual usuario) {
        buscarConAcceso(documentoId, usuario);
        return colaboradorRepository.findAllByIdDocumentoIdOrderByInvitadoEnAsc(documentoId).stream()
                .map(ColaboradorResponse::from)
                .toList();
    }

    @Transactional
    public ColaboradorResponse invitarColaborador(UUID documentoId, String email, UsuarioActual usuario) {
        Documento documento = buscarComoPropietario(documentoId, usuario);
        String emailNormalizado = email.trim().toLowerCase(Locale.ROOT);

        if (emailNormalizado.equals(usuario.email())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El propietario ya tiene acceso al documento");
        }
        if (colaboradorRepository.existsByIdDocumentoIdAndIdEmail(documento.getId(), emailNormalizado)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Ese email ya esta invitado a este documento");
        }

        Colaborador colaborador = new Colaborador(new ColaboradorId(documento.getId(), emailNormalizado));
        return ColaboradorResponse.from(colaboradorRepository.save(colaborador));
    }

    @Transactional
    public void eliminarColaborador(UUID documentoId, String email, UsuarioActual usuario) {
        buscarComoPropietario(documentoId, usuario);
        String emailNormalizado = email.trim().toLowerCase(Locale.ROOT);
        colaboradorRepository.deleteById(new ColaboradorId(documentoId, emailNormalizado));
    }

    /** Devuelve el documento si el usuario es propietario o colaborador; 403/404 si no. */
    private Documento buscarConAcceso(UUID id, UsuarioActual usuario) {
        Documento documento = buscarDocumento(id);
        boolean esPropietario = usuario.id().equals(documento.getCreadoPor());
        boolean esColaborador = colaboradorRepository
                .existsByIdDocumentoIdAndIdEmail(id, usuario.email());

        if (!esPropietario && !esColaborador) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "No tienes acceso a este documento");
        }
        return documento;
    }

    /** Devuelve el documento solo si el usuario es su propietario. */
    private Documento buscarComoPropietario(UUID id, UsuarioActual usuario) {
        Documento documento = buscarDocumento(id);
        if (!usuario.id().equals(documento.getCreadoPor())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Solo el propietario puede gestionar los colaboradores");
        }
        return documento;
    }

    private Documento buscarDocumento(UUID id) {
        return documentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No existe el documento " + id));
    }
}
