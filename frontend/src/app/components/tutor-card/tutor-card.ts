import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FeedbackService } from '../../services/feedback.service';
import { SessionsService } from '../../services/sessions.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-tutor-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tutor-card.html',
  styleUrls: ['./tutor-card.css']
})
export class TutorCardComponent {
  @Input() avgRating: number | null = null;
  @Input() ratingCount = 0;
  @Input() tutor: any;
  @Input() subjects: string[] = [];
  @Output() onBook = new EventEmitter<any>();
  private sessionsSvc = inject(SessionsService);
  private toast = inject(ToastService);

  get currentUserIsTutor() {
    try { const u = localStorage.getItem('user'); if (!u) return false; const user = JSON.parse(u); return !!user?.isTutor; } catch { return false; }
  }

  get initial() {
    const name = this.tutor?.user?.fullName || this.tutor?.user?.full_name || this.tutor?.profile?.full_name || this.tutor?.profile?.fullName || this.tutor?.fullName || this.tutor?.name || 'T';
    return (name && name.charAt) ? name.charAt(0).toUpperCase() : 'T';
  }

  // derive average rating from inputs or from tutor payload
  get displayRating(): number {
    // priority: explicit @Input avgRating, then tutor.tutor.avgRating, then tutor.rating or 0
    try {
      if (typeof this.avgRating === 'number' && !isNaN(this.avgRating)) return this.avgRating;
      const cand = this.tutor?.tutor?.avgRating || this.tutor?.avgRating || this.tutor?.rating || null;
      return cand ? Number(cand) : 0;
    } catch (e) { return 0; }
  }

  get displayRatingCount(): number {
    try {
      if (typeof this.ratingCount === 'number' && !isNaN(this.ratingCount)) return this.ratingCount;
      const cand = this.tutor?.tutor?.ratingCount || this.tutor?.ratingCount || this.tutor?.ratingCount || null;
      return cand ? Number(cand) : 0;
    } catch (e) { return 0; }
  }

  get displayHourlyRate(): number | null {
    try {
      const rate = this.tutor?.tutor?.hourlyRate || this.tutor?.hourlyRate || this.tutor?.profile?.hourlyRate || null;
      return rate ? Number(rate) : null;
    } catch (e) { return null; }
  }

  // return an array for template iteration to draw stars
  starArray() { return [1,2,3,4,5]; }

  async requestMeeting() {
    try {
      const tutorId = this.tutor && (this.tutor._id || this.tutor.id || this.tutor.profile?._id || this.tutor.user?._id);
      if (!tutorId) { this.toast.push('Unable to determine tutor id', 'error'); return; }
      this.sessionsSvc.requestMeeting(String(tutorId)).subscribe({ next: () => {
        this.toast.push('Meeting request sent', 'success');
      }, error: (err:any) => this.toast.push(err?.error?.message || 'Failed to send request', 'error') });
    } catch (e) { this.toast.push('Failed to request meeting', 'error'); }
  }

  startInstant() {
    try {
      this.sessionsSvc.instantStart().subscribe({ next: (res:any) => {
        // open the sessions page and trigger jitsi via navigation state/event
        const sess = res && res.session ? res.session : res;
        try { if (sess && !sess._id && sess.id) sess._id = sess.id; } catch {}
        try { localStorage.setItem('lastBookedSession', JSON.stringify(sess)); } catch {}
        try { window.dispatchEvent(new CustomEvent('session:booked', { detail: sess })); } catch {}
        this.toast.push('Instant meeting started', 'success');
      }, error: (err:any) => this.toast.push(err?.error?.message || 'Failed to start instant meeting', 'error') });
    } catch (e) { this.toast.push('Failed to start instant meeting', 'error'); }
  }

  formatCurrency(value: number | undefined | null) {
    const n = typeof value === 'number' ? value : Number(value || 0);
    try {
      return new Intl.NumberFormat('en-IN').format(n);
    } catch (e) {
      return String(n);
    }
  }

  get isSelf() {
    try {
      const u = localStorage.getItem('user');
      if (!u) return false;
      const user = JSON.parse(u);
      const tutorUserId = this.tutor?.user?._id || this.tutor?.user || this.tutor?.profile?._id || this.tutor?.profile?.userId;
      return String(user._id || user.id) === String(tutorUserId);
    } catch (e) { return false; }
  }

  constructor() {
    try {
      window.addEventListener('tutor:updated', (ev: any) => {
        try {
          const d = ev && ev.detail ? ev.detail : null;
          if (!d) return;
          const tid = d.tutorId || d.tutor;
          const myTid = this.tutor && (this.tutor._id || this.tutor.id || this.tutor.profile?._id || (this.tutor.tutor && this.tutor.tutor._id));
          if (!myTid) return;
          if (String(myTid) === String(tid)) {
            // update local display fields and override Inputs so template shows new values immediately
            try { if (typeof d.averageRating === 'number') { this.avgRating = d.averageRating; if (this.tutor) this.tutor.averageRating = d.averageRating; } } catch (e) {}
            try { if (typeof d.ratingCount === 'number') { this.ratingCount = d.ratingCount; if (this.tutor) this.tutor.ratingCount = d.ratingCount; } } catch (e) {}
          }
        } catch (e) {}
      });
    } catch (e) {}
  }
}
