import { Schema, Document, model } from 'mongoose';

export type ProductType = Document & {
      title: string;
      price: number;
      imagePath: string;
      description: string;
      userId: Schema.Types.ObjectId;
};

const productSchema = new Schema({
      title: {
            type: String,
            required: true,
      },
      price: {
            type: Number,
            required: true,
      },
      imagePath: {
            type: String,
            required: true,
      },
      description: {
            type: String,
            required: true,
      },
      userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
      },
});

export const Product = model<ProductType>('Product', productSchema);
