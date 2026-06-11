package com.mdshare.editor.documento;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, UUID> {

    /**
     * Documentos visibles para un usuario: los que ha creado y aquellos a los
     * que ha sido invitado como colaborador (por email).
     */
    @Query("""
            select d from Documento d
            where d.creadoPor = :usuarioId
               or d.id in (
                    select c.id.documentoId from Colaborador c
                    where c.id.email = :email
               )
            order by d.actualizadoEn desc
            """)
    List<Documento> findAccesiblesPara(@Param("usuarioId") UUID usuarioId,
                                       @Param("email") String email);
}
