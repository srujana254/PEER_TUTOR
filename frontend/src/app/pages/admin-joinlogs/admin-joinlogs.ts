import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-joinlogs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-3">
      <h4>Join Logs</h4>
      <div *ngIf="!logs">Loading...</div>
      <div *ngIf="logs && logs.length===0">No logs</div>
      <ul *ngIf="logs">
        <li *ngFor="let l of logs">
          <div><strong>{{ l.createdAt | date:'short' }}</strong> — session: {{ l.sessionId?.subject || l.sessionId?._id }} — user: {{ l.userId?.fullName || l.userId?._id || 'anon' }} — token: {{ l.tokenSnippet }} — ip: {{ l.ip }}</div>
        </li>
      </ul>
    </div>
  `
})
export class AdminJoinlogsPage {
  private api = inject(ApiService);
  logs: any[] | null = null;

  constructor() {
    this.load();
  }

  load() {
    this.api.get<any[]>('/admin/joinlogs').subscribe({ next: (list) => this.logs = list || [], error: () => this.logs = [] });
  }
}
