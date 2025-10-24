import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = inject(ApiService);
  private socketService = inject(SocketService);
  
  messages$ = new BehaviorSubject<any[]>([]);
  unreadCount$ = new BehaviorSubject<number>(0);

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    try {
      // Listen for new chat messages
      this.socketService.on('chat_message', (message: any) => {
        const currentMessages = this.messages$.value;
        this.messages$.next([...currentMessages, message]);
        
        // Update unread count
        this.unreadCount$.next(this.unreadCount$.value + 1);
      });
    } catch (e) {
      console.error('Failed to setup chat socket listeners:', e);
    }
  }

  sendMessage(sessionId: string, message: string, messageType: string = 'text', fileUrl?: string, fileName?: string, fileSize?: number) {
    return this.api.post('/chat/send', {
      sessionId,
      message,
      messageType,
      fileUrl,
      fileName,
      fileSize
    });
  }

  getMessages(sessionId: string, page: number = 1, limit: number = 50) {
    return this.api.get(`/chat/${sessionId}?page=${page}&limit=${limit}`);
  }

  markAsRead(messageId: string) {
    return this.api.post(`/chat/${messageId}/read`, {});
  }

  markAllAsRead(sessionId: string) {
    return this.api.post(`/chat/${sessionId}/read-all`, {});
  }

  getUnreadCount(sessionId: string) {
    return this.api.get(`/chat/${sessionId}/unread-count`);
  }

  // Helper method to format message time
  formatMessageTime(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString();
  }

  // Helper method to check if message is from current user
  isFromCurrentUser(message: any, currentUserId: string): boolean {
    return String(message.senderId) === String(currentUserId);
  }
}
