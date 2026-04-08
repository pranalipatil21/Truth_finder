import { Request, Response, NextFunction } from 'express';
import { resumeService } from './resume.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export class ResumeController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const resume = await resumeService.uploadResume(authReq.user.userId, req.file);
      
      res.status(201).json({
        message: 'Resume uploaded successfully. Processing in background.',
        resume: {
          id: resume.id,
          fileName: resume.fileName,
          status: resume.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getResume(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const resume = await resumeService.getResume(req.params.id, authReq.user.userId);
      res.json(resume);
    } catch (error) {
      next(error);
    }
  }

  async getResumeSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const skills = await resumeService.getResumeSkills(req.params.id, authReq.user.userId);
      res.json(skills);
    } catch (error) {
      next(error);
    }
  }

  async getUserResumes(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const resumes = await resumeService.getUserResumes(authReq.user.userId);
      res.json(resumes);
    } catch (error) {
      next(error);
    }
  }

  async deleteResume(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await resumeService.deleteResume(req.params.id, authReq.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const resumeController = new ResumeController();
