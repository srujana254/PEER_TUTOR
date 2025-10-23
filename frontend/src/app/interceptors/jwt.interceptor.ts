import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const hadToken = !!token;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = /\/api\/auth\/(signin|signup)$/.test(authReq.url);
      // When tutorGuard calls /api/tutors/me we don't want to force a global sign-out —
      // the guard should handle redirecting the user to dashboard if they are not a tutor.
      const isTutorCheck = /\/api\/tutors\/me$/.test(authReq.url);
      // log failing endpoint for debugging
      try { console.warn('HTTP error', authReq.url, err?.status); } catch (e) {}
      // Only force sign-out if we actually sent a token with the request. If there
      // was no token, let guards perform redirects without clearing local storage.
      if (hadToken && !isAuthEndpoint && !isTutorCheck && err && (err.status === 401 || err.status === 403)) {
        auth.signOut();
        router.navigateByUrl('/signin');
      }
      return throwError(() => err);
    })
  );
};


