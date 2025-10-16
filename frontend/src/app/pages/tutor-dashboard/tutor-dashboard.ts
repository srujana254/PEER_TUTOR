import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutorsService } from '../../services/tutors.service';
import { ToastService } from '../../services/toast.service';
import { SessionsService } from '../../services/sessions.service';

@Component({
  selector: 'app-tutor-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './tutor-dashboard.html',
  styleUrls: ['./tutor-dashboard.css']
})
export class TutorDashboard {
  private tutors = inject(TutorsService);
  private sessions = inject(SessionsService);
  private router = inject(Router);
  private toast = inject(ToastService);
  stats = { total: 0, completed: 0, upcoming: 0, students: 0, avgRating: 0 };
  isTutor = false;
  loading = true;

  // Become tutor form
  subjects: string[] = [];
  selectedSubjects: string[] = [];
  bio = '';
  hourlyRate: number | null = null;
  submitting = false;

  ngOnInit() {
    // Check if user is already a tutor
    this.tutors.me().subscribe({
      next: (tp) => {
        this.isTutor = !!tp;
        this.stats.avgRating = tp?.averageRating || 0;
      },
      error: () => (this.isTutor = false),
      complete: () => (this.loading = false)
    });

    // Load tutor stats if tutor
    this.sessions.list('tutor').subscribe((list: any[]) => {
      const now = new Date();
      this.stats.total = list.length;
      this.stats.completed = list.filter(s => s.status === 'completed').length;
      this.stats.upcoming = list.filter(s => s.status === 'scheduled' && new Date(s.scheduledAt) > now).length;
      this.stats.students = new Set(list.map(s => s.studentId)).size;
    });

    // Load subjects for the form
    this.tutors.listSubjects().subscribe((subs) => this.subjects = subs || []);
  }

  toggleSubject(s: string) {
    if (this.selectedSubjects.includes(s)) {
      this.selectedSubjects = this.selectedSubjects.filter(x => x !== s);
    } else {
      this.selectedSubjects = [...this.selectedSubjects, s];
    }
  }

  becomeTutor() {
    if (!this.selectedSubjects.length) return;
    this.submitting = true;
    this.tutors.become({ subjects: this.selectedSubjects, bio: this.bio, hourlyRate: this.hourlyRate || undefined })
      .subscribe({
        next: () => {
          this.isTutor = true;
          this.submitting = false;
          this.router.navigateByUrl('/find');
        },
        error: () => {
          this.submitting = false;
          this.toast.push('Failed to become a tutor', 'error');
        }
      });
  }
}
