import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { bookSession, listSessions, completeSession, cancelSession, sessionsByStudent, sessionsByTutor, startSession, joinSession, issueJoinToken, updateSession, deleteSession } from '../controllers/session.controller';

export const router = Router();

router.get('/', requireAuth, listSessions);
router.post('/', requireAuth, bookSession);
router.post('/:id/complete', requireAuth, completeSession);
router.post('/:id/cancel', requireAuth, cancelSession);
router.put('/:id', requireAuth, updateSession);
router.delete('/:id', requireAuth, deleteSession);
router.post('/:id/start', requireAuth, startSession);
router.get('/:id/join', joinSession);
router.post('/:id/issue-join', requireAuth, issueJoinToken);
router.get('/tutor/:tutorId', requireAuth, sessionsByTutor);
router.get('/student/:studentId', requireAuth, sessionsByStudent);


