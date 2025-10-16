import { Routes } from '@angular/router';
import { StudentDashboard } from './pages/student-dashboard/student-dashboard';
import { TutorDashboard } from './pages/tutor-dashboard/tutor-dashboard';
import { FindTutors } from './pages/find-tutors/find-tutors';
import { MySessions } from './pages/my-sessions/my-sessions';
import { SessionBooking } from './pages/session-booking/session-booking';
import { Feedback } from './pages/feedback/feedback';
import { Admin } from './pages/admin/admin';
import { SignInPage } from './pages/signin/signin';
import { SignUpPage } from './pages/signup/signup';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'signin', component: SignInPage, canActivate: [guestGuard] },
  { path: 'signup', component: SignUpPage, canActivate: [guestGuard] },
  { path: 'dashboard', component: StudentDashboard, canActivate: [authGuard] },
  { path: 'tutor', component: TutorDashboard, canActivate: [authGuard] },
  { path: 'find', component: FindTutors, canActivate: [authGuard] },
  { path: 'sessions', component: MySessions, canActivate: [authGuard] },
  { path: 'booking', component: SessionBooking, canActivate: [authGuard] },
  { path: 'feedback', component: Feedback, canActivate: [authGuard] },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' },
];
