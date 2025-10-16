import { Router } from 'express';
import { signIn, signUp } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.get('/me', requireAuth, (_req, res) => res.json({ ok: true }));


