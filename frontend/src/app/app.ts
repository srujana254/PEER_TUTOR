import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';
import { NotificationService } from './services/notification.service';
import { SocketService } from './services/socket.service';
import { BecomeTutorPage } from './pages/become-tutor/become-tutor';
import { ToastsComponent } from './components/toasts/toasts';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, BecomeTutorPage, ToastsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('frontend');
  showNotifications = false;
  showBecomeModal = false;
  notifications: Array<any> = [
    { id: 1, title: 'New message from Alex', body: 'Alex sent you a message about your session tomorrow.', time: '2h ago', unread: true },
    { id: 2, title: 'Session confirmed', body: 'Your session with Maya on Algebra is confirmed for Oct 18.', time: '1d ago', unread: false },
    { id: 3, title: 'New tutor joined', body: 'A tutor for Chemistry just joined the platform.', time: '3d ago', unread: false }
  ];
  private auth = inject(AuthService);
  private notificationsSvc = inject(NotificationService);
  private socketSvc = inject(SocketService);
  private router = inject(Router);

  // Expose services globally for simple page wiring prior to auth UI
  constructor() {
    // Lazy injector to avoid hard coupling in page components
    setTimeout(async () => {
      try {
  const { SessionsService } = await import('./services/sessions.service');
  const { ApiService } = await import('./services/api.service');
        // Create a tiny injector using the global app instance
        const api = new ApiService();
  (window as any).ngSessionsService = new SessionsService(api as any);
      } catch {}
    }, 0);
  }

  ngOnInit() {
    // start notifications polling when authenticated
    if (this.isAuthed()) {
      // connect socket with current token
      try { this.socketSvc.connect(localStorage.getItem('token')).catch((e: any) => {}); } catch {}

      // listen for server push events
      try { this.socketSvc.on('session_started', (data: any) => { try { window.dispatchEvent(new CustomEvent('session:started', { detail: data })); } catch {} }); } catch {}
      try { this.socketSvc.on('session_created', (data: any) => { try { window.dispatchEvent(new CustomEvent('session:booked', { detail: data })); } catch {} }); } catch {}
      try { this.notificationsSvc.start(); } catch {}
      this.notificationsSvc.notifications$.subscribe((list) => {
        // map into small header-friendly shape
        this.notifications = (list || []).map((n: any) => ({ id: n._id || n.id, title: n.type, body: n.data?.subject || '', time: new Date(n.createdAt).toLocaleString(), unread: !n.read, data: n.data }));
      });
    }
  }

  joinFromNotification(n: any) {
    const data = n?.data || {};
    // mark notification read in backend and locally
    try {
      if (n?.id) {
        this.notificationsSvc.markRead(n.id).subscribe({ next: () => {
          // update local list
          this.notifications = this.notifications.map(item => item.id === n.id ? { ...item, unread: false } : item);
        }, error: () => {} });
      }
    } catch {}

    // Prefer server join endpoint when we have sessionId + joinToken
    if (data.sessionId && data.joinToken) {
      const joinUrl = `${environment.apiUrl}/api/sessions/${data.sessionId}/join?token=${encodeURIComponent(data.joinToken)}`;
      try { window.open(joinUrl, '_blank'); } catch {}
      return;
    }
    if (data.meetingUrl) {
      try { window.open(data.meetingUrl, '_blank'); } catch {}
      return;
    }
    // nothing to do
  }

  isTutor() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return !!user?.isTutor;
    } catch {
      return false;
    }
  }

  isAuthed() {
    return this.auth.isAuthenticated();
  }

  get fullName() {
    // If you have a way to fetch user's name from localStorage or API, use it here
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.fullName || user?.full_name || null;
    } catch {
      return null;
    }
  }

  signOut() {
    this.auth.signOut();
    this.router.navigateByUrl('/signin');
  }

  openBecomeModal() {
    this.showBecomeModal = true;
  }

  onBecomeClose() {
    this.showBecomeModal = false;
  }

  onBecomeSuccess() {
    this.showBecomeModal = false;
    // optionally refresh profile or show a toast
  }

  markAllRead() {
    this.notifications = this.notifications.map(n => ({ ...n, unread: false }));
  }
}
