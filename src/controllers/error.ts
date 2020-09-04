import { Response, NextFunction, RequestHandler } from 'express';
import RequestCustom from '../utils/RequestCustom';

export const get404: RequestHandler = (req: RequestCustom, res: Response, _next: NextFunction) => {
      res.status(404).render('404', {
            pageTitle: 'Page Not Found',
            path: '/404',
            isAuthenticated: (req.session as Express.Session).isLoggedIn,
      });
};
export const get500: RequestHandler = (req: RequestCustom, res: Response, _next: NextFunction) => {
      res.status(500).render('500', {
            pageTitle: 'Error',
            path: '/500',
            isAuthenticated: (req.session as Express.Session).isLoggedIn,
            message: 'Something went wrong',
      });
};
