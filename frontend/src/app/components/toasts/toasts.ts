import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="toasts-root position-fixed top-0 end-0 p-3" style="z-index:1050">
    <div *ngFor="let t of toasts" class="toast mb-2 p-2 shadow-sm" [ngClass]="{'bg-success text-white': t.type==='success','bg-danger text-white': t.type==='error'}">
      {{ t.text }}
    </div>
  </div>
  `,
  styles: [`.toasts-root .toast{border-radius:8px;min-width:200px}`]
})
export class ToastsComponent implements OnInit {
  toasts: any[] = [];
  constructor(private svc: ToastService) {}
  ngOnInit(){ this.svc.toasts$.subscribe(list => this.toasts = list); }
}
