import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private api: ApiService) {}

  signIn(email: string, password: string) {
    return this.api.post<{ token: string; user?: any }>('/auth/signin', { email, password }).pipe(
      tap((res: { token: string; user?: any }) => {
        localStorage.setItem('token', res.token);
        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  signUp(email: string, password: string, fullName: string) {
    return this.api.post('/auth/signup', { email, password, fullName });
  }

  signOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}


