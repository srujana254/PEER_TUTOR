import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-student-dashboard',
  imports: [CommonModule],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.css']
})
export class StudentDashboard {
  private dashboardService = inject(DashboardService);
  stats = {
    total: 0,
    completed: 0,
    upcoming: 0,
    tutorsWorkedWith: 0,
    completionRate: 0
  };

  ngOnInit() {
    this.dashboardService.getStudentStats().subscribe((res) => {
      this.stats = {
        total: res.totalSessions,
        completed: res.completedSessions,
        upcoming: res.upcomingSessions,
        tutorsWorkedWith: res.tutorsWorkedWith,
        completionRate: res.performanceRate,
      };
    });
  }
}
