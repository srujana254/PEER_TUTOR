import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { 
  createRecurringSessions, 
  getRecurringSessions, 
  cancelRecurringSessions 
} from '../controllers/recurring-sessions.controller';

export const router = Router();

router.post('/', requireAuth, createRecurringSessions);
router.get('/:parentSessionId', requireAuth, getRecurringSessions);
router.delete('/:parentSessionId', requireAuth, cancelRecurringSessions);
