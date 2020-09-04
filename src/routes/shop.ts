import { Router } from 'express';
import {
      getProducts,
      getIndex,
      getCart,
      getCheckout,
      getOrders,
      getProductDetail,
      fetchProductById,
      postCart,
      deleteCart,
      postOrder,
      getInvoice,
} from '../controllers/shop';
import isAuth from '../middleware/is-auth';

const router = Router();

router.param('productId', fetchProductById);

router.get('/', getIndex);
router.get('/products', getProducts);

router.get('/products/:productId', getProductDetail);
// note: For example, router.get('/products/delete'); // will never reach this route as 'delete' will be triggered as ':productId'. Should place before '/products/:productId'

router.get('/cart', isAuth, getCart);

router.post('/cart', isAuth, postCart);

router.post('/cart-delete-item', isAuth, deleteCart);

router.get('/orders', isAuth, getOrders);
// router.post('/create-order', isAuth, postOrder);

router.get('/orders/:orderId', isAuth, getInvoice);

router.get('/checkout', isAuth, getCheckout);
router.get('/checkout/success', postOrder);
router.get('/checkout/cancel', getCheckout);

export default router;
