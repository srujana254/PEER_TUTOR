import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignUpPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  loading = false;
  error = '';

  submit() {
    if (!this.email || !this.password || !this.fullName) return;
    this.loading = true;
    this.error = '';
    this.auth.signUp(this.email, this.password, this.fullName).subscribe({
      next: () => {
        // signUp now signs in automatically and stores token/user; send user to dashboard
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: any) => {
        // surface server-provided message if available
        const msg = err?.error?.message || err?.message || 'Sign up failed';
        this.error = msg;
        this.loading = false;
      }
    });
  }
}



