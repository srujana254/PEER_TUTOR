import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFeedback extends Document {
  sessionId: Types.ObjectId;
  tutorId: Types.ObjectId;
  userId?: Types.ObjectId;
  rating: number;
  comment?: string;
}

const FeedbackSchema = new Schema<IFeedback>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  tutorId: { type: Schema.Types.ObjectId, ref: 'TutorProfile', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
}, { timestamps: true });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);


