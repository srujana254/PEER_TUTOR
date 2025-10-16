import { Component, EventEmitter, Input, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-jitsi-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jitsi-modal.html',
  styleUrls: ['./jitsi-modal.css']
})
export class JitsiModal {
  @Input() meetingUrl: string | null = null;
  @Input() visible: boolean = false;
  @Input() sessionId: string | null = null;
  @Input() joinToken: string | null = null;
  @Output() close = new EventEmitter<void>();
  iframeLoading = false;
  private fallbackTimer: any = null;
  meetingUrlSafe: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer, private toast: ToastService) {}

  onClose() {
    this.cleanup();
    this.close.emit();
  }

  openInNewTab() {
    if (!this.meetingUrl) return;
    try {
      if (this.sessionId && this.joinToken) {
        const joinUrl = `${location.origin}/api/sessions/${this.sessionId}/join?token=${encodeURIComponent(this.joinToken)}`;
        window.open(joinUrl, '_blank');
        return;
      }
      window.open(this.meetingUrl, '_blank');
    } catch {}
  }

  async copyLink() {
    if (!this.meetingUrl) return;
    try {
      await navigator.clipboard.writeText(this.meetingUrl);
      this.toast.push('Meeting link copied', 'info');
    } catch (e) {
      this.toast.push('Could not copy link', 'error');
    }
  }

  private scheduleFallback() {
    this.clearFallback();
    this.fallbackTimer = setTimeout(() => {
      // assumed blocked or not loading; fallback to external
      if (this.meetingUrl) {
        this.toast.push('Embed blocked — opening meeting in a new tab', 'info');
        this.openInNewTab();
        this.onClose();
      }
    }, 4000);
  }

  private clearFallback() { if (this.fallbackTimer) { clearTimeout(this.fallbackTimer); this.fallbackTimer = null; } }

  onIFrameLoad() {
    this.iframeLoading = false;
    this.clearFallback();
  }

  onIFrameError() {
    this.iframeLoading = false;
    this.clearFallback();
    if (this.meetingUrl) {
      this.toast.push('Failed to load embed — opening meeting in a new tab', 'info');
      this.openInNewTab();
      this.onClose();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['meetingUrl'] && this.meetingUrl) {
      this.meetingUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.meetingUrl);
    }
    if (changes['visible'] && this.visible && this.meetingUrl) {
      // when opened, start loading and schedule fallback
      this.iframeLoading = true;
      this.scheduleFallback();
    }
  }

  ngOnDestroy() { this.cleanup(); }

  private cleanup() { this.clearFallback(); this.iframeLoading = false; }
}
