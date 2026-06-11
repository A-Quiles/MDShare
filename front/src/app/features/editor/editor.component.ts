import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, Subject } from 'rxjs';

import { CambioDocumento } from '../../core/models/cambio-documento.model';
import { Colaborador } from '../../core/models/documento.model';
import { CollaborationSocketService } from '../../core/services/collaboration-socket.service';
import { DocumentoApiService } from '../../core/services/documento-api.service';
import { ExportacionService } from '../../core/services/exportacion.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { BotonTemaComponent } from '../../shared/boton-tema.component';
import { MarkdownPreviewComponent } from './markdown-preview.component';

/**
 * Sala de edicion colaborativa.
 *
 * Dos flujos independientes:
 *  - Local -> red: cada pulsacion alimenta un Subject que, tras un
 *    debounceTime(150), publica el estado por STOMP. Asi una rafaga de
 *    tecleo genera un unico mensaje en lugar de uno por tecla.
 *  - Red -> local: los cambios recibidos del topic se aplican al textarea
 *    descartando el eco de los mensajes propios.
 */
@Component({
  selector: 'app-editor',
  imports: [
    AsyncPipe,
    BotonTemaComponent,
    MarkdownPreviewComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent implements OnInit, OnDestroy {
  /** Milisegundos sin teclear antes de publicar el cambio en el canal. */
  private static readonly RETARDO_DEBOUNCE_MS = 150;

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly supabase = inject(SupabaseService);
  private readonly documentoApi = inject(DocumentoApiService);
  private readonly exportacion = inject(ExportacionService);
  protected readonly socket = inject(CollaborationSocketService);

  private readonly areaTexto =
    viewChild<ElementRef<HTMLTextAreaElement>>('areaTexto');

  protected readonly titulo = signal('');
  protected readonly contenido = signal('');
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  // Estado del panel "Compartir" (solo visible para el propietario).
  protected readonly esPropietario = signal(false);
  protected readonly panelCompartirAbierto = signal(false);
  protected readonly colaboradores = signal<Colaborador[]>([]);
  protected readonly errorCompartir = signal<string | null>(null);
  protected readonly emailInvitar = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  private documentoId = '';
  /**
   * Identidad del emisor en el canal. El sufijo aleatorio distingue dos
   * pestañas del mismo usuario, de modo que el filtro de eco no bloquee
   * la colaboracion entre ellas.
   */
  private usuarioSocket = '';
  private posicionCursor = 0;

  private readonly cambiosLocales$ = new Subject<string>();

  ngOnInit(): void {
    this.documentoId = this.route.snapshot.paramMap.get('documentoId') ?? '';
    const email = this.supabase.emailUsuario ?? 'anonimo';
    this.usuarioSocket = `${email}#${Math.random().toString(36).slice(2, 8)}`;

    this.cargarDocumento();

    // El id del documento actua como codigo de sala.
    this.socket.conectar(this.documentoId);

    // Flujo local -> red: debounce para no saturar el canal de WebSockets.
    this.cambiosLocales$
      .pipe(
        debounceTime(EditorComponent.RETARDO_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((contenidoMarkdown) =>
        this.socket.enviarCambio({
          documentoId: this.documentoId,
          usuario: this.usuarioSocket,
          contenidoMarkdown,
          posicionCursor: this.posicionCursor,
        }),
      );

    // Flujo red -> local: aplica los cambios del resto de participantes.
    this.socket.cambiosRemotos$
      .pipe(
        filter(
          (cambio): cambio is CambioDocumento =>
            cambio !== null && cambio.usuario !== this.usuarioSocket,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cambio) => this.aplicarCambioRemoto(cambio));
  }

  ngOnDestroy(): void {
    this.socket.desconectar();
  }

  protected alEscribir(evento: Event): void {
    const textarea = evento.target as HTMLTextAreaElement;
    this.posicionCursor = textarea.selectionStart ?? 0;
    this.contenido.set(textarea.value);
    this.cambiosLocales$.next(textarea.value);
  }

  private cargarDocumento(): void {
    this.documentoApi.obtener(this.documentoId).subscribe({
      next: (documento) => {
        this.titulo.set(documento.titulo);
        this.contenido.set(documento.contenido);
        this.esPropietario.set(documento.creadoPor === this.supabase.idUsuario);
        this.cargando.set(false);
        if (this.esPropietario()) {
          this.cargarColaboradores();
        }
      },
      error: (error_: HttpErrorResponse) => {
        this.error.set(
          error_.status === 403
            ? 'Este documento es privado: pide a su propietario que te invite.'
            : 'No se pudo cargar el documento.',
        );
        this.cargando.set(false);
      },
    });
  }

  // Estado de las acciones de exportacion.
  protected readonly menuDescargasAbierto = signal(false);
  protected readonly copiado = signal(false);

  protected async copiarMarkdown(): Promise<void> {
    const exito = await this.exportacion.copiar(this.contenido());
    this.copiado.set(exito);
    setTimeout(() => this.copiado.set(false), 2000);
  }

  protected alternarMenuDescargas(): void {
    this.menuDescargasAbierto.update((abierto) => !abierto);
  }

  protected descargarMarkdown(): void {
    this.exportacion.descargarMarkdown(this.titulo(), this.contenido());
    this.menuDescargasAbierto.set(false);
  }

  protected descargarHtml(): void {
    this.exportacion.descargarHtml(this.titulo(), this.contenido());
    this.menuDescargasAbierto.set(false);
  }

  protected exportarPdf(): void {
    this.exportacion.exportarPdf(this.titulo(), this.contenido());
    this.menuDescargasAbierto.set(false);
  }

  protected alternarPanelCompartir(): void {
    this.panelCompartirAbierto.update((abierto) => !abierto);
    this.errorCompartir.set(null);
  }

  protected invitar(): void {
    if (this.emailInvitar.invalid) {
      this.emailInvitar.markAsTouched();
      return;
    }

    this.errorCompartir.set(null);
    this.documentoApi
      .invitarColaborador(this.documentoId, this.emailInvitar.value.trim())
      .subscribe({
        next: (colaborador) => {
          this.colaboradores.update((lista) => [...lista, colaborador]);
          this.emailInvitar.reset();
        },
        error: (error_: HttpErrorResponse) => {
          const mensajes: Record<number, string> = {
            400: 'El propietario ya tiene acceso al documento.',
            409: 'Ese email ya está invitado.',
          };
          this.errorCompartir.set(mensajes[error_.status] ?? 'No se pudo enviar la invitación.');
        },
      });
  }

  protected quitarColaborador(email: string): void {
    this.documentoApi.eliminarColaborador(this.documentoId, email).subscribe({
      next: () =>
        this.colaboradores.update((lista) => lista.filter((c) => c.email !== email)),
      error: () => this.errorCompartir.set('No se pudo quitar al colaborador.'),
    });
  }

  private cargarColaboradores(): void {
    this.documentoApi.listarColaboradores(this.documentoId).subscribe({
      next: (colaboradores) => this.colaboradores.set(colaboradores),
      error: () => this.errorCompartir.set('No se pudo cargar la lista de colaboradores.'),
    });
  }

  /**
   * Aplica el contenido recibido conservando la posicion del cursor local
   * (al reescribir el value, el navegador lo enviaria al final del texto).
   * Estrategia last-write-wins: suficiente para el alcance del proyecto,
   * sustituible por OT/CRDT (p. ej. Yjs) sin tocar el transporte.
   */
  private aplicarCambioRemoto(cambio: CambioDocumento): void {
    const textarea = this.areaTexto()?.nativeElement;
    const cursorLocal = textarea?.selectionStart ?? 0;

    this.contenido.set(cambio.contenidoMarkdown);

    if (textarea) {
      textarea.value = cambio.contenidoMarkdown;
      const posicion = Math.min(cursorLocal, cambio.contenidoMarkdown.length);
      textarea.setSelectionRange(posicion, posicion);
    }
  }
}
