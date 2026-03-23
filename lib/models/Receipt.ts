import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReceipt extends Document {
  receipt_id: string;
  date: string;
  branch_location: string;
  service_tax_no: string;
  customer_id: string;
  billing_address: string;
  bill_no: string;
  gc_no: string;
  payment_type: string;
  bank_name: string;
  cheque_no: string;
  cheque_date: string;
  particulars: string;
  total_amount: number;
  grand_total: number;
  createdAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    receipt_id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    branch_location: { type: String, default: '' },
    service_tax_no: { type: String, default: '' },
    customer_id: { type: String, required: true },
    billing_address: { type: String, default: '' },
    bill_no: { type: String, default: '' },
    gc_no: { type: String, default: '' },
    payment_type: { type: String, default: 'Cash' },
    bank_name: { type: String, default: '' },
    cheque_no: { type: String, default: '' },
    cheque_date: { type: String, default: '' },
    particulars: { type: String, default: '' },
    total_amount: { type: Number, default: 0 },
    grand_total: { type: Number, default: 0 },
    created_by: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

ReceiptSchema.index({ created_by: 1, createdAt: -1 });
ReceiptSchema.index({ createdAt: -1 });
ReceiptSchema.index({ customer_id: 1 });

const Receipt: Model<IReceipt> =
  mongoose.models.Receipt ||
  mongoose.model<IReceipt>('Receipt', ReceiptSchema);

export default Receipt;
