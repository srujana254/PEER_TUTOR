import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class TutorsService {
  constructor(private api: ApiService) {}

  list(params?: { q?: string; subject?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.subject) qs.set('subject', params.subject);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.api.get<any>(`/tutors${suffix}`);
  }

  become(payload: { subjects: string[]; bio?: string; hourlyRate?: number }) {
    return this.api.post('/tutors/become', payload);
  }

  me() {
    return this.api.get<any>('/tutors/me');
  }

  getById(id: string) {
    return this.api.get<any>(`/tutors/${id}`);
  }

  listSubjects() {
    return this.api.get<string[]>('/tutors/subjects');
  }
}


