import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISlot extends Document {
  tutorId: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  status: 'available' | 'booked' | 'disabled' | 'expired';
  bookedBy?: Types.ObjectId | null;
  sessionId?: Types.ObjectId | null;
}

const SlotSchema = new Schema<ISlot>({
  tutorId: { type: Schema.Types.ObjectId, ref: 'TutorProfile', required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  status: { type: String, enum: ['available','booked','disabled','expired'], default: 'available' },
  bookedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', default: null },
}, { timestamps: true });

SlotSchema.index({ tutorId: 1, startAt: 1, endAt: 1 });

export const Slot = mongoose.model<ISlot>('Slot', SlotSchema);
