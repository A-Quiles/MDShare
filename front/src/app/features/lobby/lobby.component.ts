import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Documento } from '../../core/models/documento.model';
import { DocumentoApiService } from '../../core/services/documento-api.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { BotonTemaComponent } from '../../shared/boton-tema.component';

/**
 * Lobby: lista los documentos existentes y permite crear uno nuevo.
 * Entrar en un documento abre su sala de edicion colaborativa.
 */
@Component({
  selector: 'app-lobby',
  imports: [BotonTemaComponent, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnInit {
  private readonly documentoApi = inject(DocumentoApiService);
  private readonly router = inject(Router);
  protected readonly supabase = inject(SupabaseService);

  protected readonly documentos = signal<Documento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly tituloNuevo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(255)],
  });

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  protected cargarDocumentos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.documentoApi.listar().subscribe({
      next: (documentos) => {
        this.documentos.set(documentos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con el backend. ¿Está Spring Boot levantado en el puerto 8080?');
        this.cargando.set(false);
      },
    });
  }

  protected crearDocumento(): void {
    if (this.tituloNuevo.invalid) {
      this.tituloNuevo.markAsTouched();
      return;
    }

    this.documentoApi.crear({ titulo: this.tituloNuevo.value.trim() }).subscribe({
      next: (documento) => this.router.navigate(['/editor', documento.id]),
      error: () => this.error.set('No se pudo crear el documento.'),
    });
  }

  /** Documento al que el usuario accede como invitado (no es el propietario). */
  protected esCompartidoConmigo(creadoPor: string | null): boolean {
    return creadoPor !== this.supabase.idUsuario;
  }

  protected async cerrarSesion(): Promise<void> {
    await this.supabase.cerrarSesion();
    await this.router.navigate(['/login']);
  }
}
