import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  contact: string;
  gstin: string;
  billing_address: string;
  createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, default: '' },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    contact: { type: String, default: '' },
    gstin: { type: String, default: '' },
    billing_address: { type: String, default: '' },
    created_by: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

CustomerSchema.index({ created_by: 1, createdAt: -1 });
CustomerSchema.index({ createdAt: -1 });

const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
