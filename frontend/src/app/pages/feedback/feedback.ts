import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FeedbackService } from '../../services/feedback.service';
import { ToastService } from '../../services/toast.service';

@Component({
	selector: 'app-feedback',
	imports: [CommonModule],
	templateUrl: './feedback.html',
	styleUrls: ['./feedback.css']
})
export class Feedback implements OnInit {
	tutorId: string | null = null;
	list: any[] = [];
	loading = false;

	constructor(private route: ActivatedRoute, private svc: FeedbackService, private toast: ToastService) {}

	ngOnInit(): void {
		this.tutorId = this.route.snapshot.queryParamMap.get('tutorId');
		if (this.tutorId) this.load();
	}

	load() {
		if (!this.tutorId) return;
		this.loading = true;
		this.svc.listForTutor(this.tutorId).subscribe({
			next: (r: any[]) => { this.list = r; this.loading = false; },
			error: () => { this.toast.push('Failed to load feedback', 'error'); this.loading = false; }
		});
	}

	showRatingStars(n: number) {
		return '★'.repeat(n) + '☆'.repeat(5 - n);
	}

}
