import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { becomeTutor, getTutors, getMyTutorProfile, getTutorById, listSubjects } from '../controllers/tutor.controller';

export const router = Router();

router.get('/', getTutors);
router.post('/become', requireAuth, becomeTutor);
router.get('/me', requireAuth, getMyTutorProfile);
router.get('/subjects', listSubjects);
router.get('/:id', getTutorById);


