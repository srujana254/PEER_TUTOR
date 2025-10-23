import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SessionsService {
  constructor(private api: ApiService) {}

  list(role?: 'tutor' | 'student', status?: 'scheduled' | 'completed' | 'cancelled') {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    const q = params.toString() ? `?${params}` : '';
    return this.api.get<any[]>(`/sessions${q}`);
  }

  book(tutorId: string, subject: string, scheduledAt: string, durationMinutes: number, notes?: string) {
    return this.api.post('/sessions', { tutorId, subject, scheduledAt, durationMinutes, notes });
  }

  complete(sessionId: string) {
    return this.api.post(`/sessions/${sessionId}/complete`, {});
  }

  cancel(sessionId: string) {
    return this.api.post(`/sessions/${sessionId}/cancel`, {});
  }

  start(sessionId: string) {
    return this.api.post<{ meetingUrl: string; joinToken?: string; expiresAt?: string }>(`/sessions/${sessionId}/start`, {});
  }

  issueJoin(sessionId: string) {
    return this.api.post<{ joinToken: string; expiresAt: string }>(`/sessions/${sessionId}/issue-join`, {});
  }

  requestMeeting(tutorId: string, subject?: string, message?: string) {
    return this.api.post('/sessions/request', { tutorId, subject, message });
  }

  instantStart(sessionId?: string) {
    const idPart = sessionId ? `/${sessionId}/instant-start` : '/instant-start';
    return this.api.post<any>(`/sessions${idPart}`, {});
  }

  update(sessionId: string, changes: { subject?: string; scheduledAt?: string; durationMinutes?: number; notes?: string }) {
    return this.api.put(`/sessions/${sessionId}`, changes);
  }

  delete(sessionId: string) {
    return this.api.delete(`/sessions/${sessionId}`);
  }

  byTutor(tutorId: string) {
    return this.api.get<any[]>(`/sessions/tutor/${tutorId}`);
  }

  byStudent(studentId: string) {
    return this.api.get<any[]>(`/sessions/student/${studentId}`);
  }
}


