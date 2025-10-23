import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Feedback } from '../models/Feedback';
import { Session } from '../models/Session';
import { TutorProfile } from '../models/TutorProfile';

// Recompute average rating and count for a tutor and persist to TutorProfile
async function recomputeTutorRating(tutorId: any) {
  try {
    const ag = await Feedback.aggregate([
      { $match: { tutorId: typeof tutorId === 'string' ? new (require('mongoose')).Types.ObjectId(tutorId) : tutorId } },
      { $group: { _id: '$tutorId', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
    ]);
    if (ag && ag.length) {
      const rec = ag[0];
      await TutorProfile.findByIdAndUpdate(rec._id, { averageRating: rec.avg || 0, ratingCount: rec.cnt || 0 });
    } else {
      // no feedbacks -> reset
      await TutorProfile.findByIdAndUpdate(tutorId, { averageRating: 0, ratingCount: 0 });
    }
  } catch (e) {
    console.error('recomputeTutorRating failed', e);
  }
}

export async function leaveFeedback(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const { sessionId, tutorId, rating, comment } = req.body;
  if (!sessionId || !tutorId || !rating) return res.status(400).json({ message: 'Missing required fields' });

  // Ensure session exists and the current user is the student for that session
  const session = await Session.findById(sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  // session.studentId may be an ObjectId or populated object
  const studentId = session.studentId && (session.studentId as any)._id ? String((session.studentId as any)._id) : String(session.studentId);
  if (String(userId) !== String(studentId)) return res.status(403).json({ message: 'Only the student can leave feedback' });

  // Optionally prevent leaving feedback before the session ends
  try {
    const scheduled = new Date(session.scheduledAt).getTime();
    const dur = (session.durationMinutes ?? 0) * 60000;
    const end = scheduled + dur;
    if (Date.now() < end && session.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot leave feedback before the session ends' });
    }
  } catch (e) { /* ignore date parsing errors and allow */ }

  const fb = await Feedback.create({ sessionId, tutorId, rating, comment, userId });
  // Update tutor aggregates and wait so we can return authoritative tutor info
  try { await recomputeTutorRating(tutorId); } catch (e) { console.error('recompute error', e); }

  // Fetch authoritative session and include hasFeedback flag so client can rely on server state
  let sessionDoc: any = null;
  try {
    sessionDoc = await Session.findById(sessionId).lean();
    if (sessionDoc) {
      sessionDoc.hasFeedback = true;
    }
  } catch (e) { /* ignore */ }

  // Fetch updated tutor profile (aggregates) if available
  let tutorProfile: any = null;
  try {
    tutorProfile = await TutorProfile.findById(tutorId).lean();
  } catch (e) { /* ignore */ }

  res.status(201).json({ feedback: fb, session: sessionDoc, tutor: tutorProfile });
}

export async function getFeedbackForTutor(_req: AuthRequest, res: Response) {
  const { tutorId } = _req.params as any;
  const list = await Feedback.find({ tutorId }).sort({ createdAt: -1 });
  res.json(list);
}


