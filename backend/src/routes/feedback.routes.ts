import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getFeedbackForTutor, leaveFeedback } from '../controllers/feedback.controller';

export const router = Router();

router.get('/:tutorId', requireAuth, getFeedbackForTutor);
router.post('/', requireAuth, leaveFeedback);


