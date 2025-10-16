import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISession extends Document {
  tutorId: Types.ObjectId;
  studentId: Types.ObjectId;
  subject: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  meetingUrl?: string;
  joinToken?: string;
  meetingUrlExpiresAt?: Date;
}

const SessionSchema = new Schema<ISession>({
  tutorId: { type: Schema.Types.ObjectId, ref: 'TutorProfile', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, required: true, min: 30, max: 240 },
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
  notes: { type: String },
  meetingUrl: { type: String },
  joinToken: { type: String },
  meetingUrlExpiresAt: { type: Date },
}, { timestamps: true });

export const Session = mongoose.model<ISession>('Session', SessionSchema);


