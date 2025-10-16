import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Session } from '../models/Session';

export async function getStudentDashboard(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const [total, completed, upcoming, tutorsWorked] = await Promise.all([
    Session.countDocuments({ studentId: userId }),
    Session.countDocuments({ studentId: userId, status: 'completed' }),
    Session.countDocuments({ studentId: userId, status: 'scheduled', scheduledAt: { $gte: new Date() } }),
    Session.distinct('tutorId', { studentId: userId }),
  ]);

  const performanceRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  res.json({
    totalSessions: total,
    completedSessions: completed,
    upcomingSessions: upcoming,
    tutorsWorkedWith: Array.isArray(tutorsWorked) ? tutorsWorked.length : 0,
    performanceRate,
  });
}


