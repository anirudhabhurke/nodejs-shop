import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Product, ProductType } from '../models/product';
import RequestCustom from '../utils/RequestCustom';
import { validationResult } from 'express-validator';
import { deleteFile } from '../utils/file';

const ITEMS_PER_PAGE = 4;

export const getAddProduct: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      res.render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            errorMessage: undefined,
            validationErrors: [],
      });
};

export const postAddProduct: RequestHandler = (req: RequestCustom, res: Response, next: NextFunction) => {
      const inputTitle = (req.body as ProductType).title;
      const inputImage = req.file;
      const inputPrice = (req.body as ProductType).price;
      const inputDescription = (req.body as ProductType).description;

      if (!inputImage) {
            return res.status(422).render('admin/edit-product', {
                  pageTitle: 'Add Product',
                  path: '/admin/add-product',
                  editing: false,
                  errorMessage: 'Invalid file provided',
                  product: {
                        title: inputTitle,
                        price: inputPrice,
                        description: inputDescription,
                        userId: req.user?._id,
                  },
                  validationErrors: [],
            });
      }

      const imagePath = inputImage.path;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
            const errorMessage = errors.array()[0].msg;
            return res.status(422).render('admin/edit-product', {
                  pageTitle: 'Add Product',
                  path: '/admin/add-product',
                  editing: false,
                  errorMessage,
                  product: {
                        title: inputTitle,
                        price: inputPrice,
                        description: inputDescription,
                        userId: req.user?._id,
                  },
                  validationErrors: errors.array(),
            });
      } else {
            const product = new Product({
                  title: inputTitle,
                  imagePath: imagePath,
                  price: inputPrice,
                  description: inputDescription,
                  userId: req.user?._id,
            });
            product
                  .save()
                  .then(() => {
                        console.log('Product created');
                        res.redirect(301, '/admin/products');
                  })
                  .catch((error) => res.redirect('/500'));
      }
};

export const getEditProduct: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      const editMode = req.query.editing;
      if (!editMode) {
            return res.redirect('/');
      }
      const productId = req.params.productId;
      Product.findById(productId)
            .populate('userId')
            .then((product) => {
                  res.render('admin/edit-product', {
                        pageTitle: 'Edit Product',
                        path: '/admin/edit-product',
                        editing: editMode,
                        product: product,
                        errorMessage: undefined,
                        validationErrors: [],
                  });
            })
            .catch((error) => {
                  res.redirect('/500');
            });
};

export const postEditProduct: RequestHandler = (req: RequestCustom, res: Response, _next: NextFunction) => {
      const productId = (req.body as ProductType)._id;
      const inputTitle = (req.body as ProductType).title;
      const inputImage = req.file;
      const inputPrice = (req.body as ProductType).price;
      const inputDescription = (req.body as ProductType).description;

      let imagePath: string;
      if (inputImage) {
            imagePath = inputImage.path;
      }

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
            const errorMessage = errors.array()[0].msg;
            return res.status(422).render('admin/edit-product', {
                  pageTitle: 'Edit Product',
                  path: '/admin/edit-product',
                  editing: true,
                  product: {
                        title: inputTitle,
                        price: inputPrice,
                        description: inputDescription,
                        userId: req.user?._id,
                  },
                  errorMessage,
                  validationErrors: errors.array(),
            });
      } else {
            Product.findOne({ _id: productId })
                  .then((product) => {
                        if (product) {
                              if (product.userId.toString() !== req.user?._id.toString()) {
                                    res.redirect('/');
                              } else {
                                    product.title = inputTitle;
                                    product.price = inputPrice;
                                    if (imagePath) {
                                          deleteFile(product.imagePath);
                                          product.imagePath = imagePath;
                                    }
                                    product.description = inputDescription;
                                    product
                                          .save()
                                          .then(() => {
                                                res.redirect('/admin/products');
                                          })
                                          .catch((error) => res.redirect('/500'));
                              }
                        }
                  })
                  .catch((error) => res.redirect('/500'));
      }
};

export const postDeleteProduct: RequestHandler = (req: RequestCustom, res: Response, next: NextFunction) => {
      const productId = req.params.productId;
      Product.findById(productId).then((product) => {
            if (!product) {
                  return next(new Error('Product Not Found'));
            } else {
                  deleteFile(product.imagePath);
                  return Product.deleteOne({ _id: productId, userId: req.user?._id })
                        .then(() => {
                              res.status(200).json({ message: 'Deletion successful' });
                        })
                        .catch((error) => {
                              res.status(200).json({ error: 'Deletion failed' });
                        });
            }
      });
};

export const getAdminProducts: RequestHandler = (req: RequestCustom, res: Response, _next: NextFunction) => {
      const pageNo = +req.query.page! || 1;

      let totalItems: number;

      Product.find()
            .countDocuments()
            .then((numProducts) => {
                  totalItems = numProducts;
                  return Product.find({ userId: req.user?._id })
                        .skip((pageNo - 1) * ITEMS_PER_PAGE)
                        .limit(ITEMS_PER_PAGE);
            })
            .then((products) => {
                  res.render('admin/products', {
                        prods: products,
                        pageTitle: 'Admin Products',
                        path: '/admin/products',
                        currentPage: pageNo,
                        hasNextPage: pageNo * ITEMS_PER_PAGE < totalItems,
                        hasPreviousPage: pageNo > 1,
                        nextPage: pageNo + 1,
                        previousPage: pageNo - 1,
                        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                  });
            })
            .catch((error) => res.redirect('/500'));
};
