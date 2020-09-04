import express, { Request, Response, NextFunction } from 'express';
import { urlencoded } from 'body-parser';
import multer from 'multer';
import path from 'path';
import RequestCustom from './utils/RequestCustom';

import adminRoutes from './routes/admin';
import shopRoutes from './routes/shop';
import authRoutes from './routes/auth';
import { get404, get500 } from './controllers/error';

import { User } from './models/user';
import mongoose from 'mongoose';
import MongoDBSession from 'connect-mongodb-session';

import cookieParser from 'cookie-parser';
import session from 'express-session';
import csurf from 'csurf';
const MongoDBStore = MongoDBSession(session);

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');

// all encoded in text
app.use(urlencoded({ extended: true }));

const fileStorage = multer.diskStorage({
      destination: (req, file, cb) => {
            cb(null, './images');
      },
      filename: (req, file, cb) => {
            cb(null, Date.now().toString() + '-' + file.originalname);
      },
});
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
      if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true); // to store the file
      } else {
            cb(null, false); // to not store the file
      }
};

// multer parses incoming requests for files
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

// files are by default served as if they are in root directory not in public or images
app.use(express.static(path.join(__dirname, '../public')));
app.use('/images', express.static(path.join(__dirname, '../images')));

const MONGODB_URI = process.env.MONGODB_ATLAS_URI!;

const store = new MongoDBStore({ uri: MONGODB_URI, collection: 'sessions' });

const csrfProtection = csurf();

// session related middleware
app.use(cookieParser());
app.use(session({ secret: 'my session', resave: false, saveUninitialized: false, store: store }));
// use csrfProtection after session middleware because it will use that session
app.use(csrfProtection);

app.use((req: Request, res: Response, next: NextFunction) => {
      res.locals.isAuthenticated = (req.session as Express.Session).isLoggedIn;
      res.locals.csrfToken = req.csrfToken();
      next();
});

app.use((req: RequestCustom, res: Response, next: NextFunction) => {
      // throw new Error('Dummy Syncronous error')
      if (!(req.session as Express.Session).user) {
            return next();
      }
      User.findById((req.session as Express.Session).user._id)
            .then((user) => {
                  if (!user) {
                        return next();
                  }
                  req.user = user;
                  next();
            })
            .catch((error) => {
                  const err = new Error(error);
                  // err.httpStatusCode = 500
                  next(err);
            });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', get500);

app.use(get404);

// error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.log(err);
      res.status(500).render('500', {
            pageTitle: 'Error',
            path: '/500',
            isAuthenticated: (req.session as Express.Session).isLoggedIn,
            message: err.message,
      });
});

mongoose
      .connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: true,
      })
      .then(() => {
            console.log('DATABASE CONNECTED');
            app.listen(9000);
      })
      .catch((error) => console.log(error));
