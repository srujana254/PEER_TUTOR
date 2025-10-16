import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-tutor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutor-card.html',
  styleUrls: ['./tutor-card.css']
})
export class TutorCardComponent {
  @Input() avgRating: number | null = null;
  @Input() ratingCount = 0;
  @Input() tutor: any;
  @Input() subjects: string[] = [];
  @Output() onBook = new EventEmitter<any>();

  get initial() {
    const name = this.tutor?.user?.fullName || this.tutor?.user?.full_name || this.tutor?.profile?.full_name || this.tutor?.profile?.fullName || this.tutor?.fullName || this.tutor?.name || 'T';
    return (name && name.charAt) ? name.charAt(0).toUpperCase() : 'T';
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
}
