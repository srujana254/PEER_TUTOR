import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SlotsService {
  private api = inject(ApiService);

  createAvailability(payload: any) { return this.api.post('/slots/create', payload); }
  mySlots() { return this.api.get('/slots/mine'); }
  tutorSlots(tutorId: string) { return this.api.get(`/slots/tutor/${tutorId}`); }
  disableSlot(slotId: string) { return this.api.post(`/slots/${slotId}/disable`, null); }
  deleteSlot(slotId: string) { return this.api.delete(`/slots/${slotId}`); }
  bookSlot(slotId: string, payload: any) { return this.api.post(`/slots/${slotId}/book`, payload); }
  myBookings() { return this.api.get(`/slots/my-bookings`); }
}
