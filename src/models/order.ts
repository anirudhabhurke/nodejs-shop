import { Schema, Document, model } from 'mongoose';
import { ProductType } from './product';

export type OrderType = Document & {
      user: {
            email: string;
            userId: Schema.Types.ObjectId;
      };
      products: {
            product: ProductType;
            quantity: number;
      }[];
};

const orderSchema = new Schema({
      user: {
            email: {
                  type: String,
                  required: true,
            },
            userId: {
                  type: Schema.Types.ObjectId,
                  required: true,
                  ref: 'User',
            },
      },
      products: [
            {
                  product: {
                        type: Object,
                        required: true,
                  },
                  quantity: {
                        type: Number,
                        required: true,
                  },
            },
      ],
});

export const Order = model<OrderType>('Order', orderSchema);
