import { Response, Request, RequestHandler, NextFunction, RequestParamHandler } from 'express';
import { User } from '../models/user';
import * as bcrypt from 'bcrypt';
import { createTransport } from 'nodemailer';
import crypto from 'crypto';
import { validationResult } from 'express-validator';

const userEmail = process.env.COMPANY_EMAIL;
const userPassword = process.env.APP_PASSWORD;

const transporter = createTransport(`smtps://${userEmail}:${userPassword}@smtp.gmail.com`);

export const getLogin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      let errorMessage = (req.session as Express.Session).errorMessage;
      let successMessage = (req.session as Express.Session).successMessage;

      (req.session as Express.Session).successMessage = null;
      (req.session as Express.Session).errorMessage = null;

      (req.session as Express.Session).save((error) => {
            res.render('auth/login', {
                  pageTitle: 'Login',
                  path: '/login',
                  errorMessage: errorMessage,
                  successMessage: successMessage,
                  oldInput: {
                        email: '',
                        password: '',
                        confirmPassword: '',
                  },
                  validationErrors: [],
            });
      });
};
export const postLogin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      // req.isLoggedIn = true;
      // note: This above request becomes dead after response has been sent and redirect in the end creates new request
      // res.cookie('isLoggedIn', true, { httpOnly: true, secure: true });

      const email = req.body.email;
      const password = req.body.password;

      const errors = validationResult(req);
      const errorMessage = errors.array();

      if (!errors.isEmpty()) {
            (req.session as Express.Session).successMessage = null;
            (req.session as Express.Session).errorMessage = null;
            return res.status(422).render('auth/login', {
                  pageTitle: 'Login',
                  path: '/login',
                  errorMessage: errorMessage[0].msg,
                  oldInput: {
                        email,
                        password,
                  },
                  validationErrors: errors.array(),
            });
      }

      User.findOne({ email })
            .then((user) => {
                  if (user) {
                        bcrypt.compare(password, user.password, (err, result) => {
                              // note: result is if hashed passwords match
                              if (err) {
                                    // note: req.flash takes key value pair, where key is used to access
                                    // req.flash('error', 'An error has occured');
                                    (req.session as Express.Session).errorMessage = 'An error has occured';
                                    (req.session as Express.Session).successMessage = null;

                                    (req.session as Express.Session).save((error) => {
                                          return res.redirect('/login');
                                    });
                              }
                              if (result) {
                                    (req.session as Express.Session).isLoggedIn = true;
                                    (req.session as Express.Session).user = user;
                                    (req.session as Express.Session).user = user;
                                    (req.session as Express.Session).message = '';
                                    // note: to ensure session was created before redirect
                                    (req.session as Express.Session).save((error) => {
                                          return res.redirect('/');
                                    });
                              } else {
                                    console.log('Invalid email or password');
                                    (req.session as Express.Session).errorMessage = 'Invalid email or password';
                                    (req.session as Express.Session).successMessage = null;

                                    // req.flash('error', 'Invalid email or password');
                                    (req.session as Express.Session).save((error) => {
                                          return res.redirect('/login');
                                    });
                              }
                        });
                  }
            })
            .catch((err) => {
                  res.redirect('/500');
            });
};
export const postLogout: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      (req.session as Express.Session).destroy((error) => {
            res.redirect('/');
      });
};

export const getSignup: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      const errorMessage = (req.session as Express.Session).errorMessage;

      (req.session as Express.Session).successMessage = null;
      (req.session as Express.Session).errorMessage = null;
      (req.session as Express.Session).save((error) => {
            return res.render('auth/signup', {
                  pageTitle: 'Signup',
                  path: '/signup',
                  errorMessage: errorMessage,
                  oldInput: {
                        email: '',
                        password: '',
                        confirmPassword: '',
                  },
                  validationErrors: [],
            });
      });
};

export const postSignup: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      const email = req.body.email;
      const password = req.body.password;
      const confirmPassword = req.body.confirmPassword;

      const errors = validationResult(req);
      const errorMessage = errors.array();

      if (!errors.isEmpty()) {
            (req.session as Express.Session).successMessage = null;
            (req.session as Express.Session).errorMessage = null;
            return res.status(422).render('auth/signup', {
                  pageTitle: 'Signup',
                  path: '/signup',
                  errorMessage: errorMessage[0].msg,
                  oldInput: {
                        email,
                        password,
                        confirmPassword,
                  },
                  validationErrors: errors.array(),
            });
      }

      bcrypt.hash(password, 12, (err, hashedPassword) => {
            const newUser = new User({
                  email,
                  password: hashedPassword,
                  cart: { items: [] },
            });
            return newUser
                  .save()
                  .then(() => {
                        // req.flash('success', 'Success! Please login');
                        (req.session as Express.Session).successMessage = 'Success! Please login';
                        (req.session as Express.Session).save((error) => {
                              transporter.sendMail({
                                    to: email,
                                    from: userEmail,
                                    subject: 'Signup success',
                                    html: '<h1>Welcome to Node Shop</h1>',
                              });
                              return res.redirect('/login');
                        });
                  })
                  .catch((error) => res.redirect('/500'));
      });
};

export const getReset: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      const errorMessage = (req.session as Express.Session).errorMessage;
      let successMessage = (req.session as Express.Session).successMessage;

      (req.session as Express.Session).successMessage = null;
      (req.session as Express.Session).errorMessage = null;

      return res.render('auth/reset', {
            pageTitle: 'Reset Password',
            path: '/reset',
            errorMessage: errorMessage,
            successMessage: successMessage,
      });
};

export const postReset: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      crypto.randomBytes(32, (err, buffer) => {
            if (err) {
                  res.redirect('/');
            }
            const token = buffer.toString('hex'); // to convert hexadecimal to ascii
            User.findOne({ email: req.body.email })
                  .then((user) => {
                        if (!user) {
                              (req.session as Express.Session).errorMessage = 'No account with that email!';
                              (req.session as Express.Session).save((error) => {
                                    return res.redirect('/reset');
                              });
                        } else {
                              user.resetToken = token;
                              user.resetTokenExpiration = Date.now() + 3600000;
                              return user
                                    .save()
                                    .then(() => {
                                          (req.session as Express.Session).successMessage = 'Please check your email';
                                          (req.session as Express.Session).save((error) => {
                                                return res.redirect('/login');
                                          });
                                          transporter.sendMail({
                                                to: req.body.email,
                                                from: userEmail,
                                                subject: 'Password Reset Link',
                                                html: `
                                                <h1>Password Reset</h1>
                                                <p>Click this <a href="http://localhost:9000/new-password/${token}">link</a></p>
                                                <h4>Thank you</h4>
                                                `,
                                          });
                                    })
                                    .catch((error) => res.redirect('/500'));
                        }
                  })
                  .catch((error) => res.redirect('/500'));
      });
};

export const getNewPassword: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      const errorMessage = (req.session as Express.Session).errorMessage;
      let successMessage = (req.session as Express.Session).successMessage;

      (req.session as Express.Session).successMessage = null;
      (req.session as Express.Session).errorMessage = null;

      const token = req.params.token;

      User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
            .then((user) => {
                  return res.render('auth/new-password', {
                        pageTitle: 'New Password',
                        path: '/new-password',
                        errorMessage: errorMessage,
                        successMessage: successMessage,
                        userId: user?._id.toString(),
                        passwordToken: token,
                  });
            })
            .catch((error) => res.redirect('/500'));
};

export const postNewPassword: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      const newPassword = req.body.password;
      const userId = req.body.userId;
      const passwordToken = req.body.passwordToken;

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
            const errorMessage = errors.array()[0].msg;
            (req.session as Express.Session).errorMessage = errorMessage;
            (req.session as Express.Session).save((error) => {
                  return res.redirect(`/new-password/${passwordToken}`);
            });
      } else {
            User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
                  .then((user) => {
                        bcrypt.hash(newPassword, 12, (err, hashedPassword) => {
                              if (user) {
                                    user.password = hashedPassword;
                                    user.resetToken = undefined;
                                    user.resetTokenExpiration = undefined;
                                    user.save()
                                          .then(() => {
                                                (req.session as Express.Session).successMessage = 'Password reset successfully';
                                                (req.session as Express.Session).save((error) => {
                                                      return res.redirect('/login');
                                                });
                                          })
                                          .catch((error) => res.redirect('/500'));
                              }
                        });
                  })
                  .catch((error) => res.redirect('/500'));
      }
};
