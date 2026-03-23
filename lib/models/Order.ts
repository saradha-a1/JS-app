import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  order_id: string;
  customer_id: string;
  quotation_id: string;
  date: string;
  purchaser_name: string;
  billing_gstin: string;
  billing_address: string;
  purchaser_contact: string;
  receiver_name: string;
  delivery_gstin: string;
  delivery_address: string;
  receiver_contact: string;
  items: object[];
  total_basic: number;
  total_tax: number;
  grand_total: number;
  discount_percent: number;
  other_charges: number;
  final_amount: number;
  status: string;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    order_id: { type: String, required: true, unique: true },
    customer_id: { type: String, default: '' },
    quotation_id: { type: String, default: '' },
    date: { type: String, required: true },
    purchaser_name: { type: String, default: '' },
    billing_gstin: { type: String, default: '' },
    billing_address: { type: String, default: '' },
    purchaser_contact: { type: String, default: '' },
    receiver_name: { type: String, default: '' },
    delivery_gstin: { type: String, default: '' },
    delivery_address: { type: String, default: '' },
    receiver_contact: { type: String, default: '' },
    items: { type: [Schema.Types.Mixed], default: [] },
    total_basic: { type: Number, default: 0 },
    total_tax: { type: Number, default: 0 },
    grand_total: { type: Number, default: 0 },
    discount_percent: { type: Number, default: 0 },
    other_charges: { type: Number, default: 0 },
    final_amount: { type: Number, default: 0 },
    status: { type: String, default: 'processing' },
    created_by: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

OrderSchema.index({ created_by: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
