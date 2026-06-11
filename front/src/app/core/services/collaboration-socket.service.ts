import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';

import { environment } from '../../../environments/environment';
import { CambioDocumento } from '../models/cambio-documento.model';

/**
 * Cliente STOMP del editor colaborativo.
 *
 * Flujo de mensajes con el broker de Spring Boot:
 *  - Publica los cambios locales en  /app/editor.cambio/{salaCodigo}
 *  - Recibe los cambios de la sala en /topic/sala/{salaCodigo}
 *
 * El transporte es SockJS (HTTP -> WebSocket con fallback), apuntando al
 * endpoint /ws-collaborative registrado en WebSocketConfig del backend.
 */
@Injectable({ providedIn: 'root' })
export class CollaborationSocketService {
  private client: Client | null = null;
  private suscripcionSala: StompSubscription | null = null;
  private salaActual: string | null = null;

  private readonly cambiosRemotosSubject = new BehaviorSubject<CambioDocumento | null>(null);
  /**
   * Ultimo cambio difundido en la sala (null hasta que llega el primero).
   * Incluye tambien el eco de los cambios propios: el componente decide filtrarlo.
   */
  readonly cambiosRemotos$: Observable<CambioDocumento | null> =
    this.cambiosRemotosSubject.asObservable();

  private readonly conectadoSubject = new BehaviorSubject<boolean>(false);
  /** Estado de la conexion STOMP, util para mostrar un indicador en la UI. */
  readonly conectado$: Observable<boolean> = this.conectadoSubject.asObservable();

  /**
   * Abre la conexion con el broker y se suscribe al canal dinamico de la sala.
   * Si ya habia una conexion previa, la cierra primero.
   */
  conectar(salaCodigo: string): void {
    this.desconectar();
    this.salaActual = salaCodigo;

    const client = new Client({
      // SockJS exige una URL http(s); el la promociona a WebSocket si puede.
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        this.conectadoSubject.next(true);
        this.suscripcionSala = client.subscribe(
          `/topic/sala/${salaCodigo}`,
          (mensaje: IMessage) => {
            const cambio = JSON.parse(mensaje.body) as CambioDocumento;
            this.cambiosRemotosSubject.next(cambio);
          },
        );
      },

      // Tambien se invoca en cada caida previa a un reintento automatico.
      onWebSocketClose: () => this.conectadoSubject.next(false),

      onStompError: (frame) => {
        console.error('[STOMP] Error del broker:', frame.headers['message'], frame.body);
      },
    });

    client.activate();
    this.client = client;
  }

  /** Publica un cambio local para que el broker lo difunda al resto de la sala. */
  enviarCambio(cambio: CambioDocumento): void {
    if (!this.client?.connected || !this.salaActual) {
      return; // Sin conexion no se encola nada: el proximo debounce reintentara.
    }

    this.client.publish({
      destination: `/app/editor.cambio/${this.salaActual}`,
      body: JSON.stringify(cambio),
    });
  }

  /** Cierra la suscripcion y la conexion, y resetea el estado expuesto. */
  desconectar(): void {
    this.suscripcionSala?.unsubscribe();
    this.suscripcionSala = null;

    this.client?.deactivate();
    this.client = null;

    this.salaActual = null;
    this.cambiosRemotosSubject.next(null);
    this.conectadoSubject.next(false);
  }
}
