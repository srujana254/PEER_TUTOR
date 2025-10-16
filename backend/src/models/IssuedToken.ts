import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIssuedToken extends Document {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  used: boolean;
  expiresAt: Date;
}

const IssuedTokenSchema = new Schema<IIssuedToken>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

export const IssuedToken = mongoose.model<IIssuedToken>('IssuedToken', IssuedTokenSchema);
