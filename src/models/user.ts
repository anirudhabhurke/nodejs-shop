import { ProductType, Product } from './product';
import { Document, Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface CartProduct {
      productId: Schema.Types.ObjectId;
      quantity: number;
}
export interface CartType {
      items: CartProduct[];
}
export type UserType = Document & {
      email: string;
      password: string;
      cart: CartType;
      resetToken?: string;
      resetTokenExpiration?: number;
};

const userSchema = new Schema({
      email: {
            type: String,
            required: true,
      },
      password: {
            type: String,
            required: true,
      },
      cart: {
            items: [
                  {
                        productId: {
                              type: Schema.Types.ObjectId,
                              ref: 'Product',
                              required: true,
                        },
                        quantity: {
                              type: Number,
                              required: true,
                        },
                  },
            ],
      },
      resetToken: String,
      resetTokenExpiration: Number,
});

// note: "this" refers to real instance of User model based on schema
userSchema.methods.addToCart = function addToCart(product: ProductType) {
      const cartProductIndex = this.cart.items.findIndex((cp: CartProduct) => cp.productId.toString() === product._id.toString());
      let newQuantity = 1;
      const updatedCartItems = [...this.cart.items];

      if (cartProductIndex >= 0) {
            newQuantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
      } else updatedCartItems.push({ productId: product._id, quantity: newQuantity });

      const updatedCart: CartType = {
            items: updatedCartItems,
      };
      this.cart = updatedCart;
      return this.save();
};

userSchema.methods.deleteCartItem = function deleteCartItem(productId: string) {
      const updatedCartItems = this.cart.items.filter((item: CartProduct) => {
            return item.productId.toString() !== productId.toString();
      });

      this.cart = { items: updatedCartItems };
      return this.save();
};

userSchema.methods.clearCart = function clearCart() {
      this.cart = { items: [] };
      return this.save();
};

export const User = model<UserType>('User', userSchema);
