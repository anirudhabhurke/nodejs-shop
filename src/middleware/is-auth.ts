import { Response, Request, RequestHandler, NextFunction } from 'express';

const isAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
      if (!req.session?.isLoggedIn) {
            return res.redirect('/login');
      }
      next();
};

export default isAuth;
