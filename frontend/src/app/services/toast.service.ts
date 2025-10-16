import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage { id: string; text: string; type?: 'info'|'success'|'error'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts$ = new BehaviorSubject<ToastMessage[]>([]);

  push(text: string, type: 'info'|'success'|'error' = 'info', ttl = 4000) {
    const id = Math.random().toString(36).slice(2,9);
    const t: ToastMessage = { id, text, type };
    this.toasts$.next([t, ...this.toasts$.value]);
    setTimeout(() => this.dismiss(id), ttl);
  }

  dismiss(id: string) { this.toasts$.next(this.toasts$.value.filter(t => t.id !== id)); }
}
