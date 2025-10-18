import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { TutorsService } from '../services/tutors.service';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const tutorGuard: CanActivateFn = () => {
  const tutors = inject(TutorsService);
  const router = inject(Router);
  let isTutor = false;
  try {
    const u = localStorage.getItem('user');
    const user = u ? JSON.parse(u) : null;
    isTutor = !!user?.isTutor;
  } catch { isTutor = false; }
  // optimistic local pass
  if (isTutor) return true;
  // if not flagged locally, perform server check and return an observable that resolves to true or a UrlTree redirect
  return tutors.me().pipe(
    map(tp => {
      if (tp) return true;
      return router.parseUrl('/dashboard') as UrlTree;
    }),
    catchError(() => of(router.parseUrl('/dashboard') as UrlTree))
  );
};
