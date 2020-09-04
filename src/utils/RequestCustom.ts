import { ProductType } from '../models/product';
import { Request } from 'express';
import { UserType } from '../models/user';

export default interface RequestCustom extends Request {
      product?: ProductType;
      user?: UserType;
}
