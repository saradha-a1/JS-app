import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEstimation extends Document {
  estimation_id: string;
  date: string;
  from_name: string;
  to_name: string;
  from_location: string;
  to_location: string;
  items: object[];
  total_amount: number;
  createdAt: Date;
}

const EstimationSchema = new Schema<IEstimation>(
  {
    estimation_id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    from_name: { type: String, default: '' },
    to_name: { type: String, default: '' },
    from_location: { type: String, default: '' },
    to_location: { type: String, default: '' },
    items: { type: [Schema.Types.Mixed], default: [] },
    total_amount: { type: Number, default: 0 },
    created_by: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

EstimationSchema.index({ created_by: 1, createdAt: -1 });
EstimationSchema.index({ createdAt: -1 });

const Estimation: Model<IEstimation> =
  mongoose.models.Estimation ||
  mongoose.model<IEstimation>('Estimation', EstimationSchema);

export default Estimation;
