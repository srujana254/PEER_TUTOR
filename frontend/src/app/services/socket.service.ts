import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: any = null;
  constructor() {}

  async connect(token: string | null) {
    try {
      // dynamic import for socket.io-client to satisfy TypeScript and bundlers
      const mod: any = await import('socket.io-client');
      const io = mod && (mod.io || mod.default || mod) ? (mod.io || mod.default || mod) : null;
      if (!io) return;
      const base = (window as any).__API_BASE_URL__ || environment.apiUrl || '';
      // ensure we point to the backend origin (no trailing /api)
      const origin = base.replace(/\/api\/?$/, '');
      this.socket = io(origin, { auth: { token } });
      this.socket.on('connect', () => { try { console.debug('socket connected', this.socket.id); } catch (e) {} });
      this.socket.on('disconnect', (reason: any) => { try { console.debug('socket disconnected', reason); } catch (e) {} });
    } catch (e) {
      console.error('failed to init socket', e);
    }
  }

  on(eventName: string, handler: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on(eventName, handler);
  }

  off(eventName: string, handler?: any) {
    if (!this.socket) return;
    if (handler) this.socket.off(eventName, handler);
    else this.socket.removeAllListeners(eventName);
  }

  emit(eventName: string, payload: any) {
    if (!this.socket) return;
    this.socket.emit(eventName, payload);
  }
}
