import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { JitsiModal } from '../../components/jitsi-modal/jitsi-modal';
import { environment } from '../../../environments/environment';
import { SessionsService } from '../../services/sessions.service';
import { ToastService } from '../../services/toast.service';
import { NotificationService } from '../../services/notification.service';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-my-sessions',
  imports: [CommonModule, FormsModule, JitsiModal],
  templateUrl: './my-sessions.html',
  styleUrls: ['./my-sessions.css']
})
export class MySessions {
  private sessionsService = inject(SessionsService);
  private notificationsSvc = inject(NotificationService);
  private toast = inject(ToastService);
  private feedbackSvc = inject(FeedbackService);
  sessions: any[] = [];
  filter: 'all' | 'upcoming' | 'past' = 'past';
  // view mode: 'student' or 'tutor'
  sessionsView: 'student' | 'tutor' = 'student';
  // how many minutes before scheduled time should we show a 'waiting' state
  preStartWindowMinutes = 15;
  feedbackSession: any = null;
  feedbackRating = 5;
  feedbackComment = '';
  startingSessionId: string | null = null;
  // for in-app Jitsi modal
  jitsiVisible = false;
  jitsiUrl: string | null = null;
  jitsiSessionId: string | null = null;
  jitsiJoinToken: string | null = null;
  // details overlay
  selectedSession: any = null;
  // editing state
  editingSession: any = null;
  editSubject = '';
  editScheduledAt = '';
  editDuration = 60;
  editNotes = '';
  // notification subscription and periodic refresh
  private notifSub: Subscription | null = null;
  private refreshTimer: any = null;
  private dashboardViewHandler: any = null;

  get currentUser() {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  isTutorForSession(s: any) {
    const user = this.currentUser;
    if (!user) return false;
    // If the current user is a tutor, the backend returns sessions filtered for
    // that tutor (the controller resolves the TutorProfile._id). In that case
    // it's safe to consider the session belonged to the current tutor.
    if (user.isTutor === true) return true;
    // Otherwise, session.tutorId may be an id string or object; also check populated tutor.user
    const tutorId = s.tutorId || s.tutor?._id || s.tutor?.userId || s.tutor?.user?._id;
    return String(tutorId) === String(user._id) || String(tutorId) === String(user.id);
  }

  canStartSession(s: any) {
    if (s.status !== 'scheduled') return false;
    const now = new Date();
    const scheduled = new Date(s.scheduledAt);
    const startWindow = new Date(scheduled.getTime() - 15 * 60000);
    const endWindow = new Date(scheduled.getTime() + 4 * 60 * 60000);
    return now >= startWindow && now <= endWindow;
  }

  startSession(s: any) {
    if (!s || !s._id) return;
    this.startingSessionId = s._id;
    this.sessionsService.start(s._id).subscribe({
      next: (res: any) => {
        this.startingSessionId = null;
        const url = res?.meetingUrl;
        const token = res?.joinToken || res?.token;
        const expires = res?.expiresAt || res?.meetingUrlExpiresAt || null;
        if (url) {
          // update local session state
          s.meetingUrl = url;
          if (token) s.joinToken = token;
          if (expires) s.meetingUrlExpiresAt = expires;
          s.status = 'in-progress';
          // refresh sessions from server so UI stays consistent
          this.reloadSessions();
          // refresh notifications immediately
          try { this.notificationsSvc.loadOnce(); } catch {}
          // broadcast event so other components can respond
          try { window.dispatchEvent(new CustomEvent('session:started', { detail: { sessionId: s._id, meetingUrl: url, joinToken: token, expiresAt: expires } })); } catch {}
          // open in-app Jitsi modal when users prefer in-app; fallback to new tab if iframe blocked
          this.jitsiUrl = url;
          this.jitsiVisible = true;
          this.jitsiSessionId = s._id;
          this.jitsiJoinToken = token || null;
        } else {
          this.toast.push('Meeting URL not returned', 'error');
        }
      },
      error: (err: any) => {
  this.startingSessionId = null;
  this.toast.push(err?.error?.message || 'Failed to start session', 'error');
      }
    });
  }

  joinSession(s: any) {
    // mark any related notifications as read (if present)
    try {
      const notifs = (this.notificationsSvc.notifications$ as any).getValue ? (this.notificationsSvc.notifications$ as any).getValue() : [];
      if (Array.isArray(notifs)) {
        const matched = notifs.filter((n: any) => n && n.data && String(n.data.sessionId) === String(s._id));
        matched.forEach((n: any) => {
          try { this.notificationsSvc.markRead(n._id || n.id).subscribe({ next: () => {}, error: () => {} }); } catch (e) {}
        });
        // server-side bulk mark as a convenience (will mark any notification with data.sessionId)
        try { this.notificationsSvc.markReadBySession(String(s._id)).subscribe({ next: () => {}, error: () => {} }); } catch (e) {}
      }
    } catch (e) {}

    const url = s.meetingUrl;
    const user = this.currentUser;
    if (user && user._id) {
      // if authenticated, request a short-lived join token from server (single-use) then open the join endpoint
      try {
        this.sessionsService.issueJoin(s._id).subscribe({ next: (res: any) => {
          const joinUrl = `${environment.apiUrl}/api/sessions/${s._id}/join?token=${encodeURIComponent(res.joinToken)}`;
          try { window.open(joinUrl, '_blank'); } catch { /* ignore */ }
        }, error: () => {
          // fallback to modal/opening meetingUrl if issuing token fails
          if (url) { this.jitsiUrl = url; this.jitsiVisible = true; }
          else this.toast.push('Failed to obtain join token', 'error');
        } });
      } catch (e) {
        if (url) { this.jitsiUrl = url; this.jitsiVisible = true; }
      }
    } else {
      // not authenticated: open in-app modal when meetingUrl present, otherwise suggest waiting
      if (url) {
        this.jitsiUrl = url;
        this.jitsiVisible = true;
      } else if (s.status === 'in-progress') {
        this.toast.push('Meeting URL not available yet', 'info');
      } else if (this.isWaitingForTutor(s)) {
        this.toast.push('Waiting for tutor to start the session', 'info');
      } else {
        this.toast.push('Session has not started yet', 'info');
      }
    }
  }

  isWaitingForTutor(s: any) {
    try {
      if (!s || !s.scheduledAt) return false;
      const now = new Date();
      const scheduled = new Date(s.scheduledAt);
      const preWindow = new Date(scheduled.getTime() - this.preStartWindowMinutes * 60000);
      return now >= preWindow && now < scheduled && s.status === 'scheduled' && !this.isTutorForSession(s);
    } catch (e) {
      return false;
    }
  }

  // whether the session time window is over (scheduledAt + durationMinutes)
  isSessionEnded(s: any) {
    try {
      if (!s || !s.scheduledAt) return false;
      const scheduled = new Date(s.scheduledAt).getTime();
      const dur = (s.durationMinutes ?? s.duration ?? 0) * 60000;
      if (!dur) return false; // unknown duration -> don't assume ended
      const end = scheduled + dur;
      return Date.now() > end;
    } catch (e) { return false; }
  }

  ngOnInit() {
    try {
      const stored = localStorage.getItem('sessionsView');
      if (stored === 'student' || stored === 'tutor') this.sessionsView = stored;
    } catch (e) {}
    this.reloadSessions();
    // reload when we receive a session_started notification so Join becomes visible quickly
    try {
      this.notifSub = this.notificationsSvc.notifications$.subscribe(list => {
        if (!list || !Array.isArray(list)) return;
        const hasStart = list.some((n: any) => n && n.type === 'session_started');
        if (hasStart) this.reloadSessions();
      });
    } catch (e) {}
    // periodic refresh as a fallback (every 15s)
    try { this.refreshTimer = setInterval(() => this.reloadSessions(), 15000); } catch (e) {}
  }

  ngOnDestroy() {
    try { this.notifSub?.unsubscribe(); } catch (e) {}
    try { if (this.refreshTimer) clearInterval(this.refreshTimer); } catch (e) {}
    // removed dashboard view event subscription
  }

  reloadSessions() {
    const role: 'tutor' | 'student' = this.sessionsView === 'tutor' ? 'tutor' : 'student';
    this.sessionsService.list(role).subscribe({ next: (list) => this.sessions = list || [], error: () => {} });
  }

  setSessionsView(v: 'student' | 'tutor') {
    this.sessionsView = v;
    try { localStorage.setItem('sessionsView', v); } catch (e) {}
    this.reloadSessions();
  }

  setFilter(f: 'all' | 'upcoming' | 'past') {
    this.filter = f;
  }

  get visibleSessions() {
    const now = new Date();
    if (this.filter === 'all') return this.sessions;
    if (this.filter === 'upcoming') return this.sessions.filter(s => new Date(s.scheduledAt) > now);
    return this.sessions.filter(s => new Date(s.scheduledAt) <= now);
  }

  formatTime(s: any) {
    try {
      const d = new Date(s.scheduledAt);
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // backend stores duration in `durationMinutes`
      const durVal = s.durationMinutes ?? s.duration ?? null;
      const dur = durVal ? ` (${durVal} min)` : '';
      return `${time}${dur}`;
    } catch {
      return '';
    }
  }

  openFeedback(s: any) {
    // Prevent tutors from opening feedback UI
    if (this.isTutorForSession(s)) {
      this.toast.push('Tutors cannot leave feedback for students', 'info');
      return;
    }
    this.feedbackSession = s;
    this.feedbackRating = 5;
    this.feedbackComment = '';
  }

  openEdit(s: any) {
    this.editingSession = { ...s };
    this.editSubject = s.subject || '';
    // ISO string without seconds for easy editing in datetime-local
    try { this.editScheduledAt = new Date(s.scheduledAt).toISOString().slice(0,16); } catch { this.editScheduledAt = ''; }
    this.editDuration = s.durationMinutes || s.duration || 60;
    this.editNotes = s.notes || '';
  }

  saveEdit() {
    if (!this.editingSession) return;
    const id = this.editingSession._id;
  const payload: any = { subject: this.editSubject, durationMinutes: Number(this.editDuration), notes: this.editNotes };
  if (this.editScheduledAt) payload.scheduledAt = new Date(this.editScheduledAt).toISOString();
  this.sessionsService.update(id, payload)
      .subscribe({ next: (res: any) => {
        this.toast.push('Session updated', 'success');
        this.editingSession = null;
        this.reloadSessions();
      }, error: (err: any) => {
        this.toast.push(err?.error?.message || 'Failed to update session', 'error');
      } });
  }

  cancelEdit() {
    this.editingSession = null;
  }

  confirmDelete(s: any) {
    // no-op (deprecated)
  }

  deleteSession(s: any) {
    if (!s || !s._id) return;
    this.sessionsService.delete(s._id).subscribe({ next: () => {
      this.toast.push('Session deleted', 'info');
      this.reloadSessions();
    }, error: (err: any) => this.toast.push(err?.error?.message || 'Failed to delete session', 'error') });
  }

  markComplete(s: any) {
    if (!s || !s._id) return;
    this.sessionsService.complete(s._id).subscribe({ next: (res: any) => {
      this.toast.push('Session marked complete', 'success');
      this.reloadSessions();
    }, error: (err: any) => this.toast.push(err?.error?.message || 'Failed to mark complete', 'error') });
  }

  viewDetails(s: any) {
    // open details overlay
    this.selectedSession = s;
  }

  submitFeedback() {
    if (!this.feedbackSession) return;
    // Double-check user role before submitting
    if (this.isTutorForSession(this.feedbackSession)) {
      this.toast.push('Tutors cannot leave feedback for students', 'error');
      this.feedbackSession = null;
      return;
    }
    // Determine tutorId to send: session may contain tutorId (TutorProfile._id) or a populated tutor object
    const sess: any = this.feedbackSession;
    const tutorId = sess.tutorId || sess.tutor?._id || sess.tutor?.user?._id || sess.tutor?._id || null;
    if (!tutorId) {
      this.toast.push('Unable to determine tutor for this session', 'error');
      this.feedbackSession = null;
      return;
    }

    this.feedbackSvc.leave(this.feedbackSession._id, String(tutorId), this.feedbackRating, this.feedbackComment)
      .subscribe({ next: () => {
        this.feedbackSession = null;
        this.toast.push('Feedback submitted', 'success');
      }, error: (err: any) => this.toast.push(err?.error?.message || 'Please sign in to leave feedback', 'error') });
  }

  getOtherPartyName(s: any) {
    const user = this.currentUser;
    if (!user) return s.tutor?.name || s.tutorName || s.studentName || 'Participant';
    const amTutor = (user.isTutor === true) || this.isTutorForSession(s);
    if (amTutor) {
      // show student name
      return s.student?.fullName || s.studentName || (s.studentId ? String(s.studentId).slice(-6) : 'Student');
    }
    // show tutor name
    return this.getTutorName(s);
  }

  // helper to consistently resolve a tutor's display name for templates
  getTutorName(s: any) {
    try {
      if (!s) return 'Tutor';
      // Try multiple shapes the backend might return:
      // - session.tutor.user.fullName
      // - session.tutor.fullName / tutor.name
      // - session.tutorId.userId.fullName (older population shape)
      // - top-level session.tutorName provided by the controller
      const candidates = [
        s.tutor?.user?.fullName,
        s.tutor?.user?.full_name,
        s.tutor?.fullName,
        s.tutor?.name,
        s.tutorName,
        s.tutorId?.userId?.fullName,
        s.tutorId?.user?.fullName,
        s.tutorId?.fullName,
        s.tutorId?._id
      ];
      for (const c of candidates) {
        if (c && typeof c === 'string' && c.trim()) return c;
      }
      return 'Tutor';
    } catch (e) { return 'Tutor'; }
  }

  // derive initials for avatar from the tutor name (fallback to 'T')
  getTutorInitials(s: any) {
    try {
      const name = this.getTutorName(s);
      if (!name || typeof name !== 'string') return 'T';
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return 'T';
      if (parts.length === 1) return parts[0].slice(0,1).toUpperCase();
      return (parts[0].slice(0,1) + parts[parts.length-1].slice(0,1)).toUpperCase();
    } catch (e) { return 'T'; }
  }

  openExternal(url: string | null) {
    if (!url) return;
    try {
      // if session has a joinToken, open the server join endpoint instead (so server can verify token)
      const s = this.selectedSession;
      if (s && s._id && s.joinToken) {
        const joinUrl = `${environment.apiUrl}/api/sessions/${s._id}/join?token=${encodeURIComponent(s.joinToken)}`;
        window.open(joinUrl, '_blank');
        return;
      }
      window.open(url, '_blank');
    } catch { /* ignore */ }
  }

  async copyMeetingLink(url: string | null) {
    if (!url) return this.toast.push('No meeting link available', 'error');
    try {
      await navigator.clipboard.writeText(url);
      this.toast.push('Meeting link copied', 'info');
    } catch (e) {
      this.toast.push('Failed to copy link', 'error');
    }
  }

  closeJitsi() {
    this.jitsiVisible = false;
    this.jitsiSessionId = null;
    this.jitsiJoinToken = null;
  }
}
