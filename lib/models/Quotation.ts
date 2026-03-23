import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuotation extends Document {
  quotation_id: string;
  estimation_id: string;
  date: string;
  customer_id: string;
  customer_name: string;
  from_location: string;
  to_location: string;
  items: object[];
  total_basic: number;
  total_tax: number;
  grand_total: number;
  created_by: string;
  createdAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    quotation_id: { type: String, required: true, unique: true },
    estimation_id: { type: String, default: '' },
    date: { type: String, required: true },
    customer_id: { type: String, default: '' },
    customer_name: { type: String, default: '' },
    from_location: { type: String, default: '' },
    to_location: { type: String, default: '' },
    items: { type: [Schema.Types.Mixed], default: [] },
    total_basic: { type: Number, default: 0 },
    total_tax: { type: Number, default: 0 },
    grand_total: { type: Number, default: 0 },
    created_by: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

QuotationSchema.index({ created_by: 1, createdAt: -1 });
QuotationSchema.index({ createdAt: -1 });

const Quotation: Model<IQuotation> =
  mongoose.models.Quotation ||
  mongoose.model<IQuotation>('Quotation', QuotationSchema);

export default Quotation;
