import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RecordingService {
  private api = inject(ApiService);

  startRecording(sessionId: string) {
    return this.api.post(`/recordings/${sessionId}/start`, {});
  }

  stopRecording(sessionId: string, recordingUrl: string, duration: number, fileSize: number) {
    return this.api.post(`/recordings/${sessionId}/stop`, {
      recordingUrl,
      duration,
      fileSize
    });
  }

  getRecording(sessionId: string) {
    return this.api.get(`/recordings/${sessionId}`);
  }

  listUserRecordings(page: number = 1, limit: number = 20) {
    return this.api.get(`/recordings?page=${page}&limit=${limit}`);
  }

  // Helper method to format duration
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
