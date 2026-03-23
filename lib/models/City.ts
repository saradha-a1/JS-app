import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICity extends Document {
  name: string;
  state_id: string;
  createdAt: Date;
}

const CitySchema = new Schema<ICity>(
  {
    name: { type: String, required: true },
    state_id: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const City: Model<ICity> =
  mongoose.models.City || mongoose.model<ICity>('City', CitySchema);

export default City;
