import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IState extends Document {
  name: string;
  createdAt: Date;
}

const StateSchema = new Schema<IState>(
  { name: { type: String, required: true, unique: true } },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const State: Model<IState> =
  mongoose.models.State || mongoose.model<IState>('State', StateSchema);

export default State;
