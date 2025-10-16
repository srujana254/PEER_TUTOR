import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-session-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-booking.html',
  styleUrls: ['./session-booking.css']
})
export class SessionBooking {
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();

  subjects: string[] = ['Math', 'Physics', 'Chemistry'];
  subject: string | null = null;
  date: string | null = null;
  time: string | null = null;
  duration: string | null = '1 hour';
  notes: string | null = null;

  closeModal() { this.close.emit(); }
  confirmBooking() { this.confirm.emit({ subject: this.subject, date: this.date, time: this.time, duration: this.duration, notes: this.notes }); }
}
