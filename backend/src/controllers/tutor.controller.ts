import { Request, Response } from 'express';
import { TutorProfile } from '../models/TutorProfile';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getTutors(req: Request, res: Response) {
  const { q, subject, page = '1', limit = '10' } = req.query as Record<string, string>;
  const pageNum = Math.max(parseInt(page || '1', 10), 1);
  const limitNum = Math.min(Math.max(parseInt(limit || '10', 10), 1), 50);

  const filter: any = {};
  if (subject) filter.subjects = { $in: [subject] };

  // Text search by user fullName or email via populate later
  const pipeline: any[] = [
    { $match: filter },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    // Lookup feedbacks to compute average rating and count
    { $lookup: {
      from: 'feedbacks',
      localField: '_id',
      foreignField: 'tutorId',
      as: 'feedbacks'
    } },
    { $addFields: {
      ratingCount: { $size: '$feedbacks' },
      avgRating: { $cond: [ { $gt: [ { $size: '$feedbacks' }, 0 ] }, { $avg: '$feedbacks.rating' }, null ] }
    } },
  ];
  if (q) {
    pipeline.push({
      $match: {
        $or: [
          { 'user.fullName': { $regex: q, $options: 'i' } },
          { 'user.email': { $regex: q, $options: 'i' } },
          { subjects: { $elemMatch: { $regex: q, $options: 'i' } } },
        ],
      },
    });
  }
  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $facet: {
    data: [{ $skip: (pageNum - 1) * limitNum }, { $limit: limitNum }],
    total: [{ $count: 'count' }],
  }});

  const agg = await TutorProfile.aggregate(pipeline);
  const data = agg[0]?.data || [];
  const total = agg[0]?.total?.[0]?.count || 0;
  res.json({ data, page: pageNum, limit: limitNum, total });
}

export async function becomeTutor(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { subjects, bio, hourlyRate } = req.body as { subjects: string[]; bio?: string; hourlyRate?: number };
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) return res.status(400).json({ message: 'subjects required' });
  let tutor = await TutorProfile.findOneAndUpdate(
    { userId },
    { $set: { subjects, bio, hourlyRate } },
    { new: true }
  );
  if (!tutor) tutor = await TutorProfile.create({ userId, subjects, bio, hourlyRate });
  await User.findByIdAndUpdate(userId, { isTutor: true });
  res.json(tutor);
}

export async function getMyTutorProfile(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const tutor = await TutorProfile.findOne({ userId }).populate('userId', 'fullName email');
  if (!tutor) return res.status(404).json({ message: 'Tutor profile not found' });
  res.json(tutor);
}

export async function getTutorById(req: Request, res: Response) {
  const { id } = req.params;
  const tutor = await TutorProfile.findById(id).populate('userId', 'fullName email');
  if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
  res.json(tutor);
}

export async function listSubjects(_req: Request, res: Response) {
  // Derive subjects from tutor profiles for now
  const tutors = await TutorProfile.find({}, { subjects: 1, _id: 0 });
  const set = new Set<string>();
  tutors.forEach(t => (t.subjects || []).forEach((s: string) => set.add(s)));
  res.json(Array.from(set).sort((a, b) => a.localeCompare(b)));
}


