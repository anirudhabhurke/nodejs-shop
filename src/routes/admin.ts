import { Router } from 'express';
const router = Router();
import { getAddProduct, postAddProduct, getAdminProducts, getEditProduct, postEditProduct, postDeleteProduct } from '../controllers/admin';
import isAuth from '../middleware/is-auth';
import { body } from 'express-validator';

router.get('/add-product', isAuth, getAddProduct);

router.post(
      '/add-product',
      [
            body('title', 'Invalid title').isLength({ min: 5 }),
            body('price', 'Invalid price').isCurrency(),
            body('description', 'Invalid description').isLength({ max: 400, min: 10 }),
      ],
      isAuth,
      postAddProduct
);

router.get('/edit-product/:productId', isAuth, getEditProduct);

router.post(
      '/edit-product',
      [
            body('title', 'Invalid title').isLength({ min: 5 }),
            body('price', 'Invalid price').isCurrency(),
            body('description', 'Invalid description').isLength({ max: 400, min: 10 }),
      ],
      isAuth,
      postEditProduct
);

router.delete('/product/:productId', isAuth, postDeleteProduct);

router.get('/products', isAuth, getAdminProducts);

export default router;
