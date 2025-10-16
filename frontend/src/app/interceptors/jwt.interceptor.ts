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

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = /\/api\/auth\/(signin|signup)$/.test(authReq.url);
      if (!isAuthEndpoint && err && (err.status === 401 || err.status === 403)) {
        auth.signOut();
        router.navigateByUrl('/signin');
      }
      return throwError(() => err);
    })
  );
};


