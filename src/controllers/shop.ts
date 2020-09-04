import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction, RequestHandler, RequestParamHandler } from 'express';
import { Product } from '../models/product';
import RequestCustom from '../utils/RequestCustom';
import { Order } from '../models/order';
import { UserType, CartProduct } from '../models/user';
import PDFDocument from 'pdfkit';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2020-08-27', typescript: true });

const ITEMS_PER_PAGE = 4;

export const fetchProductById: RequestParamHandler = (req: RequestCustom, res: Response, next: NextFunction, productId: string) => {
      Product.findById(productId)
            .then((product) => {
                  req.product = product!;
                  next();
            })
            .catch((err) => res.redirect('/500'));
};

export const getProducts: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      const pageNo = +req.query.page! || 1;

      let totalItems: number;

      Product.find()
            .countDocuments()
            .then((numProducts) => {
                  totalItems = numProducts;
                  return Product.find()
                        .skip((pageNo - 1) * ITEMS_PER_PAGE)
                        .limit(ITEMS_PER_PAGE);
            })
            .then((products) => {
                  res.render('shop/product-list', {
                        prods: products,
                        pageTitle: 'My Shop',
                        path: '/products',
                        currentPage: pageNo,
                        hasNextPage: pageNo * ITEMS_PER_PAGE < totalItems,
                        hasPreviousPage: pageNo > 1,
                        nextPage: pageNo + 1,
                        previousPage: pageNo - 1,
                        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                  });
            })
            .catch((err) => res.redirect('/500'));
};

export const getProductDetail: RequestHandler = (req: RequestCustom, res: Response, next: NextFunction) => {
      res.render('shop/product-detail', {
            product: req.product,
            pageTitle: req.product?.title,
            path: '/products',
      });
};

export const getIndex: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      const pageNo = +req.query.page! || 1;

      let totalItems: number;

      Product.find()
            .countDocuments()
            .then((numProducts) => {
                  totalItems = numProducts;
                  return Product.find()
                        .skip((pageNo - 1) * ITEMS_PER_PAGE)
                        .limit(ITEMS_PER_PAGE);
            })
            .then((products) => {
                  res.render('shop/index', {
                        prods: products,
                        pageTitle: 'All Products',
                        path: '/',
                        currentPage: pageNo,
                        hasNextPage: pageNo * ITEMS_PER_PAGE < totalItems,
                        hasPreviousPage: pageNo > 1,
                        nextPage: pageNo + 1,
                        previousPage: pageNo - 1,
                        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                  });
            })
            .catch((err) => res.redirect('/500'));
};

export const postCart: RequestHandler<{ productId: string }> = (req: RequestCustom, res: Response, next: NextFunction) => {
      const productId = (req.body as { productId: string }).productId;
      Product.findById(productId)
            .then((product) => {
                  return (req.user as any).addToCart(product);
            })
            .then((result) => {
                  console.log('Added to Cart');
                  res.redirect('/cart');
            })
            .catch((err) => {
                  res.redirect('/500');
            });
};

export const getCart: RequestHandler = (req: RequestCustom, res: Response, next: NextFunction) => {
      req.user
            ?.populate('cart.items.productId')
            .execPopulate()
            .then((user: UserType) => {
                  res.render('shop/cart', {
                        pageTitle: 'Your Cart',
                        path: '/cart',
                        cart: user.cart.items,
                  });
            })
            .catch((err: any) => {
                  res.redirect('/500');
            });
};

export const deleteCart: RequestHandler<{ productId: string }> = (req: RequestCustom, res: Response, next: NextFunction) => {
      const productId = (req.body as { productId: string }).productId;
      (req.user as any)
            ?.deleteCartItem(productId)
            .then(() => {
                  console.log('Deleted item from Cart');
                  res.redirect('/cart');
            })
            .catch((err: any) => {
                  res.redirect('/500');
            });
};

export const getCheckout: RequestHandler = (req: RequestCustom, res: Response, next: NextFunction) => {
      let products: CartProduct[];
      let total = 0;
      req.user
            ?.populate('cart.items.productId')
            .execPopulate()
            .then((user: UserType) => {
                  products = user.cart.items;
                  total = 0;
                  products.forEach((p) => {
                        total += p.quantity * (p.productId as any).price;
                  });
                  return stripe.checkout.sessions.create({
                        payment_method_types: ['card'],
                        line_items: products.map((p) => {
                              return {
                                    name: (p.productId as any).title,
                                    description: (p.productId as any).description,
                                    amount: (p.productId as any).price * 100,
                                    currency: 'usd',
                                    quantity: p.quantity,
                              };
                        }),
                        // note: You cannot rely on success_url for payments
                        // note: Use Stripe webhooks for stripe to send a request to url
                        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
                        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
                  });
            })
            .then((session) => {
                  res.render('shop/checkout', {
                        pageTitle: 'Checkout',
                        path: '/checkout',
                        products: products,
                        totalSum: total,
                        sessionId: session.id,
                  });
            })
            .catch((err: any) => {
                  res.redirect('/500');
            });
};

export const getOrders: RequestHandler = (req: RequestCustom, res: Response, next: NextFunction) => {
      Order.find({ 'user.userId': req.user?._id })
            .then((orders: any) => {
                  res.render('shop/orders', {
                        pageTitle: 'Orders',
                        path: '/orders',
                        orders: orders,
                  });
            })
            .catch((err: any) => {
                  res.redirect('/500');
            });
};

export const postOrder: RequestHandler = (req: RequestCustom, res: Response, next: NextFunction) => {
      req.user
            ?.populate('cart.items.productId')
            .execPopulate()
            .then((user: UserType) => {
                  const products = user.cart.items.map((item) => {
                        return {
                              quantity: item.quantity,
                              product: { ...(item.productId as any)._doc },
                        };
                  });
                  const order = new Order({
                        user: {
                              email: (req.session as Express.Session).user?.email,
                              userId: (req.session as Express.Session).user?._id,
                        },
                        products,
                  });
                  return order.save();
            })
            .then(() => {
                  return (req.user as any).clearCart();
            })
            .then(() => {
                  res.status(301).redirect('/orders');
            })
            .catch((err: any) => {
                  res.redirect('/500');
            });
};

export const getInvoice: RequestHandler = (req: RequestCustom, res: Response, next: NextFunction) => {
      const orderId = req.params.orderId;

      Order.findById(orderId, (err, order) => {
            if (!order) {
                  return next(new Error('No order found'));
            }
            if (order.user.userId.toString() !== req.user?._id.toString()) {
                  return next(new Error('Access denied'));
            }

            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

            pdfDoc.pipe(fs.createWriteStream(invoicePath)); // store on server
            pdfDoc.pipe(res);
            pdfDoc.fontSize(26).text('Invoice');
            pdfDoc.fontSize(18).text(`----------------------------------------------`);

            let totalPrice: number = 0;
            order.products.forEach((prod) => {
                  totalPrice = totalPrice + prod.quantity * prod.product.price;
                  pdfDoc.fontSize(13).text(`${prod.product.title} - (${prod.quantity}) x $${prod.product.price}`);
            });
            pdfDoc.fontSize(18).text(`----------------------------------------------`);
            pdfDoc.fontSize(18).text(`Total Price: ${totalPrice}`);
            pdfDoc.end();

            // fs.readFile(invoicePath, (err, data) => {
            //       if (err) {
            //             return next(err);
            //       }
            //       res.setHeader('Content-Type', 'application/pdf');
            //       res.setHeader('Content-Disposition', 'attchment; filename="' + invoiceName + '"');
            //       res.send(data);
            // });

            // const file = fs.createReadStream(invoicePath);
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Disposition', 'attchment; filename="' + invoiceName + '"');

            // forward data that is read in
            // pipe writeable stream(res) by using readable streams
            // file.pipe(res);
      });
};
