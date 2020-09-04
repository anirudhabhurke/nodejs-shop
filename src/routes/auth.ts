import { Router } from 'express';
import { check, body } from 'express-validator';
import {
      getLogin,
      postLogin,
      postLogout,
      getSignup,
      postSignup,
      getReset,
      postReset,
      getNewPassword,
      postNewPassword,
} from '../controllers/auth';
import isAuth from '../middleware/is-auth';
import { User } from '../models/user';

const router = Router();

router.get('/login', getLogin);
router.post(
      '/login',
      [
            check('email')
                  .isEmail()
                  .withMessage('Please enter valid email')
                  .custom((value, { req }) => {
                        return User.findOne({ email: value })
                              .then((userDoc) => {
                                    if (!userDoc) {
                                          return Promise.reject('Email does not exists');
                                    }
                              })
                              .catch((error) => console.log(error));
                  })
                  .normalizeEmail()
                  .trim(),
      ],
      postLogin
);

router.get('/signup', getSignup);
router.post(
      '/signup',
      [
            check('email')
                  .isEmail()
                  .withMessage('Please enter valid email')
                  .custom((value, { req }) => {
                        // if (value === 'test@test.com') {
                        //       throw new Error('Email forbidden');
                        //       // or return false for default error message
                        // } else return true; // true for allowing value

                        // this returns a promise for which express validator will wait for resolve/reject
                        return User.findOne({ email: value })
                              .then((userDoc) => {
                                    if (userDoc) {
                                          return Promise.reject('Email already exists');
                                    }
                              })
                              .catch((error) => console.log(error));
                  })
                  .normalizeEmail()
                  .trim(),
            // second param of body() is for default error message for all checks
            body('password', 'Password must be between 5 to 32 alphanumeric characters')
                  .isLength({ min: 5, max: 32 })
                  .isAlphanumeric()
                  .trim(),
            body('confirmPassword')
                  .custom((value, { req }) => {
                        if (value !== req.body.password) {
                              throw new Error('passwords must match');
                        } else return true;
                  })
                  .trim(),
      ],
      postSignup
);

router.post('/logout', isAuth, postLogout);

router.get('/reset', getReset);
router.post('/reset', postReset);

router.get('/new-password/:token', getNewPassword);
router.post(
      '/new-password',
      [
            body('password', 'Password must be between 5 to 32 alphanumeric characters')
                  .isLength({ min: 5, max: 32 })
                  .isAlphanumeric()
                  .trim(),
            body('confirmPassword')
                  .custom((value, { req }) => {
                        if (value !== req.body.password) {
                              throw new Error('passwords must match');
                        } else return true;
                  })
                  .trim(),
      ],
      postNewPassword
);

export default router;
