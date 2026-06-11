import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Colaborador,
  CrearDocumentoRequest,
  Documento,
} from '../models/documento.model';

/**
 * Acceso a la API REST de Spring Boot. La identidad del usuario viaja en las
 * cabeceras que adjunta el authInterceptor; el backend filtra por ella.
 * El contenido en vivo NO pasa por aqui: viaja por STOMP.
 */
@Injectable({ providedIn: 'root' })
export class DocumentoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/documentos`;

  /** Documentos propios y aquellos en los que el usuario colabora. */
  listar(): Observable<Documento[]> {
    return this.http.get<Documento[]>(this.baseUrl);
  }

  obtener(id: string): Observable<Documento> {
    return this.http.get<Documento>(`${this.baseUrl}/${id}`);
  }

  crear(request: CrearDocumentoRequest): Observable<Documento> {
    return this.http.post<Documento>(this.baseUrl, request);
  }

  listarColaboradores(documentoId: string): Observable<Colaborador[]> {
    return this.http.get<Colaborador[]>(`${this.baseUrl}/${documentoId}/colaboradores`);
  }

  invitarColaborador(documentoId: string, email: string): Observable<Colaborador> {
    return this.http.post<Colaborador>(`${this.baseUrl}/${documentoId}/colaboradores`, { email });
  }

  eliminarColaborador(documentoId: string, email: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${documentoId}/colaboradores/${encodeURIComponent(email)}`,
    );
  }

  /** Solo el propietario puede borrar el documento. */
  eliminarDocumento(documentoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${documentoId}`);
  }
}
