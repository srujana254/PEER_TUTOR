import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService) {}

  getStudentStats() {
    return this.api.get<{ totalSessions: number; completedSessions: number; upcomingSessions: number; tutorsWorkedWith: number; performanceRate: number }>(
      '/dashboard/student'
    );
  }
}


