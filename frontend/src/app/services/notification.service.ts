import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications$ = new BehaviorSubject<any[]>([]);
  private pollSub: Subscription | null = null;
  private pollingInterval = 12000; // 12s

  constructor(private api: ApiService, private zone: NgZone) {}

  start() {
    // load immediately
    this.loadOnce();
    // start polling
    if (!this.pollSub) {
      this.pollSub = interval(this.pollingInterval)
        .pipe(switchMap(() => this.api.get<any[]>('/notifications')))
        .subscribe({ next: (list) => this.zone.run(() => this.notifications$.next(list || [])), error: () => {} });
    }
  }

  stop() {
    try { this.pollSub?.unsubscribe(); } catch {}
    this.pollSub = null;
  }

  loadOnce() {
    this.api.get<any[]>('/notifications').subscribe({ next: (list) => this.zone.run(() => this.notifications$.next(list || [])), error: () => {} });
  }

  markRead(id: string) {
    return this.api.post(`/notifications/${id}/read`, {});
  }

  markReadBySession(sessionId: string) {
    return this.api.post(`/notifications/session/${sessionId}/read`, {});
  }
}
