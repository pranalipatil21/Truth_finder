import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from './error.middleware';

export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requireCandidate = requireRole(['CANDIDATE', 'ADMIN']);
export const requireRecruiter = requireRole(['RECRUITER', 'ADMIN']);
export const requireAdmin = requireRole(['ADMIN']);
