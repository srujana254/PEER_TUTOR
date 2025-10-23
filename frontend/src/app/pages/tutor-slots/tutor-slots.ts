import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlotsService } from '../../services/slots.service';
import { ToastService } from '../../services/toast.service';

@Component({ selector: 'app-tutor-slots', standalone: true, imports: [CommonModule, FormsModule], template: `
<div class="p-3">
  <h3>Manage Availability</h3>
  <div class="card p-3 mb-3">
  <label class="form-label small">Date</label>
  <input type="date" class="form-control mb-2" [(ngModel)]="date" (ngModelChange)="onDateChange($event)" [attr.min]="minDate" />
    <label class="form-label small">Start Time</label>
    <input type="time" class="form-control mb-2" [(ngModel)]="startTime" [attr.min]="minTime || null" />

    <div class="d-flex align-items-center gap-2 mb-2">
      <div class="form-check">
        <input class="form-check-input" type="radio" name="mode" id="modeDuration" [checked]="!useEndTime" (change)="useEndTime=false">
        <label class="form-check-label small" for="modeDuration">Use duration (hours)</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="mode" id="modeEndTime" [checked]="useEndTime" (change)="useEndTime=true">
        <label class="form-check-label small" for="modeEndTime">Enter end time</label>
      </div>
    </div>

    <div *ngIf="!useEndTime">
      <label class="form-label small">Availability Window (hours)</label>
      <input type="number" class="form-control mb-2" [(ngModel)]="availabilityHours" />
    </div>
    <div *ngIf="useEndTime">
      <label class="form-label small">End Time</label>
      <input type="time" class="form-control mb-2" [(ngModel)]="endTime" />
    </div>

    <label class="form-label small">Slot Duration (minutes)</label>
    <input type="number" class="form-control mb-2" [(ngModel)]="duration" />
    <div class="text-end"><button class="btn btn-primary" (click)="create()">Create Slots</button></div>
  </div>

  <h4>Your Slots</h4>
  <div *ngFor="let s of slots" class="card p-2 mb-2 d-flex justify-content-between align-items-center">
    <div>
      {{ s.startAt | date:'short' }} - {{ s.endAt | date:'short' }}
      <span *ngIf="s.status === 'booked'" class="badge bg-warning ms-2">Booked</span>
      <span *ngIf="s.status === 'disabled'" class="badge bg-secondary ms-2">Disabled</span>
      <span *ngIf="s.status === 'available'" class="badge bg-success ms-2">Available</span>
    </div>
    <div>
      <button class="btn btn-sm btn-outline-secondary me-2" (click)="disable(s)">Disable</button>
      <button class="btn btn-sm btn-danger" [disabled]="s.status === 'booked'" (click)="del(s)">Delete</button>
    </div>
  </div>
  <div *ngIf="slots.length===0" class="text-muted">No slots yet</div>
</div>
`,
  styles: [`.card{display:flex;align-items:center;justify-content:space-between}`]
})
export class TutorSlots implements OnInit {
  private svc = inject(SlotsService);
  private toast = inject(ToastService);
  date: string = '';
  minDate: string = '';
  minTime: string = '';
  startTime: string = '';
  private minTimeTimer: any = null;
  // if true, use explicit endTime input; otherwise use availabilityHours to compute endTime
  useEndTime = false;
  endTime = '';
  availabilityHours = 3;
  duration = 60;
  slots: any[] = [];

  ngOnInit() {
    // set date picker min to today
    this.minDate = new Date().toISOString().slice(0,10);
    // set minTime for the start time input if date === today
    this.updateMinTime();
    this.load();
  }

  ngOnDestroy() {
    try { if (this.minTimeTimer) { clearInterval(this.minTimeTimer); this.minTimeTimer = null; } } catch (e) {}
  }

  onDateChange(v: string) {
    this.date = v;
    this.updateMinTime();
  }

  updateMinTime() {
    try {
      // Only enforce a min time when selected date is today
      if (!this.date) {
        this.minTime = '';
        return;
      }
      const today = new Date().toISOString().slice(0,10);
      if (this.date !== today) {
        this.minTime = '';
        // stop live updates when not today
        try { if (this.minTimeTimer) { clearInterval(this.minTimeTimer); this.minTimeTimer = null; } } catch (e) {}
        return;
      }
      // round up to next minute to avoid selecting the immediate past
      const now = new Date();
      now.setSeconds(0);
      now.setMilliseconds(0);
      now.setMinutes(now.getMinutes() + 1);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      this.minTime = `${hh}:${mm}`;
      // start a live timer to keep minTime advancing while date === today
      try {
        if (!this.minTimeTimer) {
          this.minTimeTimer = setInterval(() => {
            try { this.updateMinTime(); } catch (e) {}
          }, 30 * 1000); // update every 30 seconds
        }
      } catch (e) {}
      // if startTime is earlier than minTime, clear it so user must pick a valid time
      try {
        if (this.startTime && this.startTime < this.minTime) this.startTime = '';
      } catch (e) {}
    } catch (e) { this.minTime = ''; }
  }
  load() { this.svc.mySlots().subscribe({ next: (s: any) => {
      const all = s || [];
      const now = Date.now();
      // show only upcoming slots
      this.slots = all.filter((slot: any) => new Date(slot.startAt).getTime() >= now);
    }, error: () => this.toast.push('Failed to load slots', 'error') }); }

  create() {
    if (!this.date || !this.startTime || !this.duration) return this.toast.push('Fill all fields', 'info');
    const [sh, sm] = (this.startTime || '').split(':').map((x: any) => Number(x));
    if (Number.isNaN(sh) || Number.isNaN(sm)) return this.toast.push('Invalid start time', 'info');
    // prevent creating slots in the past
    try {
      const start = new Date(`${this.date}T${this.startTime}`);
      if (start.getTime() < Date.now()) return this.toast.push('Cannot create slots in the past', 'info');
    } catch (e) {}
    let endTime: string;
    if (this.useEndTime) {
      if (!this.endTime) return this.toast.push('Enter end time', 'info');
      const [eh, em] = (this.endTime || '').split(':').map((x: any) => Number(x));
      if (Number.isNaN(eh) || Number.isNaN(em)) return this.toast.push('Invalid end time', 'info');
      const start = new Date(`${this.date}T${this.startTime}`);
      const end = new Date(`${this.date}T${this.endTime}`);
      if (end <= start) return this.toast.push('End time must be after start time', 'info');
      endTime = this.endTime;
    } else {
      if (!this.availabilityHours) return this.toast.push('Fill all fields', 'info');
      const start = new Date(`${this.date}T${this.startTime}`);
      const end = new Date(start.getTime() + Number(this.availabilityHours) * 3600000);
      const eh = String(end.getHours()).padStart(2, '0');
      const em = String(end.getMinutes()).padStart(2, '0');
      endTime = `${eh}:${em}`;
    }
    this.svc.createAvailability({ date: this.date, startTime: this.startTime, endTime, slotDurationMinutes: this.duration }).subscribe({ next: (res: any) => { this.toast.push(`${res.created || 0} slots created`, 'success'); this.load(); }, error: (err: any) => this.toast.push(err?.error?.message || 'Failed to create slots','error') });
  }

  disable(s: any) { this.svc.disableSlot(s._id).subscribe({ next: () => { this.toast.push('Disabled', 'info'); this.load(); }, error: () => this.toast.push('Failed to disable','error') }); }

  del(s: any) { this.svc.deleteSlot(s._id).subscribe({ next: () => { this.toast.push('Deleted', 'info'); this.load(); }, error: (err:any) => this.toast.push(err?.error?.message || 'Failed to delete','error') }); }
}