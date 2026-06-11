package com.mdshare.editor.colaborador;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ColaboradorRepository extends JpaRepository<Colaborador, ColaboradorId> {

    List<Colaborador> findAllByIdDocumentoIdOrderByInvitadoEnAsc(UUID documentoId);

    boolean existsByIdDocumentoIdAndIdEmail(UUID documentoId, String email);
}
