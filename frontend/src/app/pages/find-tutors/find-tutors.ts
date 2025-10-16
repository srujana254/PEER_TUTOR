import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorsService } from '../../services/tutors.service';
import { ToastService } from '../../services/toast.service';
import { SessionsService } from '../../services/sessions.service';
import { TutorCardComponent } from '../../components/tutor-card/tutor-card';

@Component({
  selector: 'app-find-tutors',
  imports: [CommonModule, FormsModule, TutorCardComponent],
  templateUrl: './find-tutors.html',
  styleUrls: ['./find-tutors.css']
})
export class FindTutors {
  private tutorsService = inject(TutorsService);
  private toast = inject(ToastService);
  private sessionsService = inject(SessionsService);
  tutors: any[] = [];
  filtered: any[] = [];
  search = '';
  subjects: string[] = [];
  selectedSubject = '';
  loading = true;
  bookingTutorId: string | null = null;
  bookSubject = '';
  bookWhen = '';
  // New booking modal state
  bookDate = '';
  bookTime = '';
  bookDuration: number = 60;
  bookNotes = '';
  bookingInProgress = false;
  bookingError = '';
  selectedTutorSubjects: string[] = [];

  ngOnInit() {
    // Load tutors with pagination (page 1)
    this.tutorsService.list({ q: this.search || undefined, subject: this.selectedSubject || undefined, page: 1, limit: 20 }).subscribe({
      next: (res) => {
        const list = (res && res.data) ? res.data : res;
        this.tutors = list || [];
        this.filtered = [...this.tutors];
        // if subjects not loaded yet, derive as fallback
        if (!this.subjects.length) {
          const set = new Set<string>();
          this.tutors.forEach(t => (t.subjects || []).forEach((s: string) => set.add(s)));
          this.subjects = Array.from(set).sort((a, b) => a.localeCompare(b));
        }
      },
      error: () => {},
      complete: () => { this.loading = false; }
    });

    // Load subjects from backend authoritative list
    this.tutorsService.listSubjects().subscribe({
      next: (subs) => {
        if (Array.isArray(subs) && subs.length) {
          this.subjects = subs;
        }
      },
    });

    // Refresh when a new tutor profile is created elsewhere in the app
    // Use the enhanced handler which accepts event.detail to prepend the created tutor
    window.addEventListener('tutor:created', this.onTutorCreatedWithDetail as EventListener);
  }

  onTutorCreated = () => {
    // re-run the same query to fetch updated tutors
    this.doFilter();
  }

  // Enhanced handler to accept event details (created tutor) and update lists immediately
  onTutorCreatedWithDetail = (ev: any) => {
    try {
      const detail = ev?.detail || null;
      if (detail) {
        // Convert to expected tutor shape: if API returned only tutor profile, try to shape it
        const newTutor = detail && detail._id ? detail : null;
        // If we don't have a full tutor object, prefer to requery; otherwise prepend
        if (newTutor) {
          // Prepend to tutors and filtered arrays to reflect immediately
          this.tutors = [newTutor, ...this.tutors];
          // If current filters match the new tutor, also add to filtered; otherwise re-run server filter
          const matchesSubject = !this.selectedSubject || (newTutor.subjects || []).includes(this.selectedSubject);
          const matchesSearch = !this.search || (newTutor.profile && (newTutor.profile.full_name || '').toLowerCase().includes(this.search.toLowerCase()));
          if (matchesSubject && matchesSearch) {
            this.filtered = [newTutor, ...this.filtered];
          } else {
            // Update counts only and leave filtering to server when user changes filters
          }
          return;
        }
      }
    } catch (e) {}

    // Default fallback: requery backend for the latest list
    this.doFilter();
  }

  ngOnDestroy() {
    try { window.removeEventListener('tutor:created', this.onTutorCreatedWithDetail as EventListener); } catch {}
  }

  doFilter() {
    // Requery backend for accurate server-side filtering
    this.loading = true;
    this.tutorsService
      .list({ q: this.search || undefined, subject: this.selectedSubject || undefined, page: 1, limit: 20 })
      .subscribe({
        next: (res) => {
          const list = (res && res.data) ? res.data : res;
          this.filtered = list || [];
        },
        complete: () => (this.loading = false),
      });
  }

  

  openBooking(tutor: any) {
    // Accept either a full tutor object or just an id
    const id = tutor && (tutor._id || tutor.id || (typeof tutor === 'string' ? tutor : null));
    // defensive: prevent booking self
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const user = JSON.parse(u);
        const tutorUserId = tutor?.user?._id || tutor?.user || tutor?.profile?._id || tutor?.profile?.userId;
        if (String(user._id || user.id) === String(tutorUserId)) {
          this.toast.push('You cannot book a session with yourself', 'info');
          return;
        }
      }
    } catch (e) {}

    this.bookingTutorId = id;
    const subj = tutor && (tutor.subjects || tutor.tutor?.subjects || tutor.subject || []);
    this.bookSubject = (Array.isArray(subj) ? subj[0] : subj) || '';
    this.selectedTutorSubjects = Array.isArray(subj) ? subj : (subj ? [subj] : []);
    // reset booking form fields
    this.bookDate = '';
    this.bookTime = '';
    this.bookDuration = 60;
    this.bookNotes = '';
    this.bookingError = '';
    this.bookingInProgress = false;
  }

  book() {
    // kept for backward compatibility if used elsewhere
    if (!this.bookingTutorId || !this.bookSubject || !this.bookWhen) return;
    const scheduledAt = new Date(this.bookWhen).toISOString();
    this.sessionsService.book(this.bookingTutorId, this.bookSubject, scheduledAt, 60).subscribe({
      next: () => {
        this.bookingTutorId = null;
        this.toast.push('Session booked', 'success');
      },
      error: () => this.toast.push('Please sign in to book', 'error')
    });
  }

  confirmBooking() {
    this.bookingError = '';
    if (!this.bookingTutorId) return;
    if (!this.bookSubject) { this.bookingError = 'Please select a subject'; return; }
    if (!this.bookDate || !this.bookTime) { this.bookingError = 'Please select date and time'; return; }
    const scheduledAt = new Date(`${this.bookDate}T${this.bookTime}`).toISOString();
    this.bookingInProgress = true;
    this.sessionsService.book(this.bookingTutorId, this.bookSubject, scheduledAt, Number(this.bookDuration), this.bookNotes).subscribe({
      next: () => {
        this.bookingInProgress = false;
        this.bookingTutorId = null;
        this.toast.push('Session booked', 'success');
      },
      error: (err: any) => {
        this.bookingInProgress = false;
        this.bookingError = err?.error?.message || err?.message || 'Failed to book session';
        this.toast.push(this.bookingError, 'error');
      }
    });
  }
}
