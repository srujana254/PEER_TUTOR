import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotsService } from '../../services/slots.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({ selector: 'app-slots-browser', standalone: true, imports: [CommonModule], template: `
<div class="p-3">
  <h3>Available Slots <small *ngIf="tutorName" class="text-muted">for {{ tutorName }}</small></h3>
  <div *ngFor="let s of slots" class="card p-2 mb-2 d-flex justify-content-between align-items-center">
    <div>
      {{ s.startAt | date:'short' }} - {{ s.endAt | date:'short' }}
      <span *ngIf="s.status === 'booked'" class="badge bg-warning ms-2">Booked</span>
      <span *ngIf="s.status === 'disabled'" class="badge bg-secondary ms-2">Disabled</span>
      <span *ngIf="s.status === 'available'" class="badge bg-success ms-2">Available</span>
    </div>
    <div>
      <button *ngIf="isAuthenticated && s.status === 'available'" class="btn btn-sm btn-primary" (click)="book(s)">Book</button>
      <a *ngIf="!isAuthenticated" href="/signin" class="btn btn-sm btn-outline-primary">Sign in to book</a>
    </div>
  </div>
  <div *ngIf="slots.length===0" class="text-muted">No available slots</div>
</div>

<!-- Confirmation modal -->
<div *ngIf="showConfirm" class="feedback-backdrop">
  <div class="feedback-modal card p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="fw-semibold">Confirm booking</div>
      <button class="btn-close" (click)="cancelBooking()"></button>
    </div>
    <div>Book slot at <strong>{{ selectedSlot?.startAt | date:'short' }}</strong> ?</div>
    <div class="d-flex gap-2 justify-content-end mt-3">
      <button class="btn btn-outline-secondary" (click)="cancelBooking()">Cancel</button>
      <button class="btn btn-primary" (click)="confirmBooking()">Confirm</button>
    </div>
  </div>
</div>
` })
export class SlotsBrowser implements OnInit {
  private svc = inject(SlotsService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private router = inject(Router);
  slots: any[] = [];
  tutorName: string | null = null;
  isAuthenticated = false;
  // confirmation modal state
  showConfirm = false;
  selectedSlot: any = null;
  ngOnInit() { this.load(); }
  load() {
    const q = this.route.snapshot.queryParams || {};
  const tutorId = q['tutorId'] || 'me';
    this.isAuthenticated = !!localStorage.getItem('token');
    this.svc.tutorSlots(tutorId).subscribe({ next: (s:any) => this.slots = s || [], error: () => this.toast.push('Failed to load slots','error') });
    if (tutorId && tutorId !== 'me') {
      // fetch tutor name for display
      this.api.get(`/tutors/${tutorId}`).subscribe({ next: (t:any) => { this.tutorName = (t as any)?.user?.fullName || (t as any)?.full_name || (t as any)?.name || null; }, error: () => {} });
    }
  }
  // open confirmation modal
  book(s: any) {
    if (!this.isAuthenticated) { window.location.href = '/signin'; return; }
    if (s.status !== 'available') { this.toast.push('Slot not available', 'info'); return; }
    this.selectedSlot = s;
    this.showConfirm = true;
  }

  confirmBooking() {
    if (!this.selectedSlot) return;
    this.svc.bookSlot(this.selectedSlot._id, {}).subscribe({ next: () => {
      this.toast.push('Booked', 'success');
      this.showConfirm = false;
      // route to sessions page to show the booked session
      try { this.router.navigate(['/sessions']); } catch (e) { window.location.href = '/sessions'; }
    }, error: (err:any) => { this.toast.push(err?.error?.message || 'Failed to book','error'); this.showConfirm = false; } });
  }

  cancelBooking() { this.showConfirm = false; this.selectedSlot = null; }
}
