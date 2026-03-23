import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArticleItem extends Document {
  name: string;
  status: string;
  createdAt: Date;
}

const ArticleItemSchema = new Schema<IArticleItem>(
  {
    name: { type: String, required: true },
    status: { type: String, default: 'active' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const ArticleItem: Model<IArticleItem> =
  mongoose.models.ArticleItem ||
  mongoose.model<IArticleItem>('ArticleItem', ArticleItemSchema);

export default ArticleItem;
