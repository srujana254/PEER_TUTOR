import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITutorProfile extends Document {
  userId: Types.ObjectId;
  averageRating: number;
  ratingCount: number;
  subjects: string[];
  bio?: string;
  hourlyRate?: number;
}

const TutorProfileSchema = new Schema<ITutorProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  subjects: { type: [String], default: [] },
  bio: { type: String },
  hourlyRate: { type: Number },
}, { timestamps: true });

export const TutorProfile = mongoose.model<ITutorProfile>('TutorProfile', TutorProfileSchema);


