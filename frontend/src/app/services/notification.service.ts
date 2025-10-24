import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications$ = new BehaviorSubject<any[]>([]);
  unreadCount$ = new BehaviorSubject<number>(0);
  private pollSub: Subscription | null = null;
  private pollingInterval = 8000; // 8s - faster polling
  private unreadCountSub: Subscription | null = null;

  constructor(private api: ApiService, private zone: NgZone, private socketService: SocketService) {}

  start() {
    // load immediately
    this.loadOnce();
    this.loadUnreadCount();
    
    // Set up WebSocket listeners for real-time notifications
    this.setupWebSocketListeners();
    
    // Keep minimal polling as fallback (every 30 seconds)
    if (!this.pollSub) {
      this.pollSub = interval(30000)
        .pipe(switchMap(() => this.api.get<any[]>('/notifications')))
        .subscribe({ 
          next: (list) => this.zone.run(() => this.notifications$.next(list || [])), 
          error: () => {} 
        });
    }
  }

  stop() {
    try { this.pollSub?.unsubscribe(); } catch {}
    try { this.unreadCountSub?.unsubscribe(); } catch {}
    this.pollSub = null;
    this.unreadCountSub = null;
  }

  loadOnce() {
    this.api.get<any[]>('/notifications').subscribe({ 
      next: (list) => this.zone.run(() => this.notifications$.next(list || [])), 
      error: () => {} 
    });
  }

  loadUnreadCount() {
    this.api.get<{unreadCount: number}>('/notifications/unread-count').subscribe({ 
      next: (result) => this.zone.run(() => this.unreadCount$.next(result?.unreadCount || 0)), 
      error: () => {} 
    });
  }

  markRead(id: string) {
    return this.api.post(`/notifications/${id}/read`, {});
  }

  markAllRead() {
    return this.api.post('/notifications/mark-all-read', {});
  }

  markReadBySession(sessionId: string) {
    return this.api.post(`/notifications/session/${sessionId}/read`, {});
  }

  deleteNotification(id: string) {
    return this.api.delete(`/notifications/${id}`);
  }

  getNotificationsByCategory(category: string) {
    return this.api.get<any[]>(`/notifications?category=${category}`);
  }

  getUnreadNotifications() {
    return this.api.get<any[]>('/notifications?unreadOnly=true');
  }

  private setupWebSocketListeners() {
    try {
      // Listen for real-time notifications
      this.socketService.on('notification', (notification: any) => {
        this.zone.run(() => {
          // Add new notification to the list
          const currentNotifications = this.notifications$.value;
          const updatedNotifications = [notification, ...currentNotifications];
          this.notifications$.next(updatedNotifications);
          
          // Update unread count
          if (!notification.read) {
            this.unreadCount$.next(this.unreadCount$.value + 1);
          }
        });
      });

      // Listen for session updates
      this.socketService.on('session_update', (update: any) => {
        this.zone.run(() => {
          // Handle session-related notifications
          console.log('Session update received:', update);
        });
      });
    } catch (e) {
      console.error('Failed to setup WebSocket listeners:', e);
    }
  }
}
