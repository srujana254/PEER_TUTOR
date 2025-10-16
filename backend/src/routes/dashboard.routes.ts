import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getStudentDashboard } from '../controllers/dashboard.controller';

export const router = Router();

router.get('/student', requireAuth, getStudentDashboard);


