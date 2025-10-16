import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private api: ApiService) {}

  leave(sessionId: string, tutorId: string, rating: number, comment?: string) {
    return this.api.post('/feedback', { sessionId, tutorId, rating, comment });
  }

  listForTutor(tutorId: string) {
    return this.api.get<any[]>(`/feedback/${tutorId}`);
  }
}


