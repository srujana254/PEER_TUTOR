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
  // Recurring session support
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurringEndDate?: Date;
  parentSessionId?: Types.ObjectId; // Reference to the original session for recurring sessions
  recurringSessionNumber?: number; // 1, 2, 3, etc. for recurring sessions
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
  // Recurring session fields
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'] },
  recurringEndDate: { type: Date },
  parentSessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
  recurringSessionNumber: { type: Number, default: 1 }
}, { timestamps: true });

export const Session = mongoose.model<ISession>('Session', SessionSchema);


