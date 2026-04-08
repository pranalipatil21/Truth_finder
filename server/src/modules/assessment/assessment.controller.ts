import { Request, Response, NextFunction } from 'express';
import { assessmentService } from './assessment.service';
import { createSessionSchema, submitAnswerSchema, submitAnswersSchema } from './assessment.dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export class AssessmentController {
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { resumeId, participantId } = createSessionSchema.parse(req.body);
      const session = await assessmentService.createSession(authReq.user.userId, resumeId, participantId);

      res.status(201).json({
        message: 'Assessment session created',
        session,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCreationProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { resumeId } = req.params;
      const progress = assessmentService.generationProgress.get(resumeId);
      if (progress) {
        res.json(progress);
      } else {
        res.json({ total: 10, generated: 10, message: 'Complete' });
      }
    } catch (error) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const session = await assessmentService.getSession(req.params.id, authReq.user.userId);
      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const session = await assessmentService.startSession(req.params.id, authReq.user.userId);
      res.json({
        message: 'Assessment started',
        session,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { questionId, answer, selectedOption } = submitAnswerSchema.parse(req.body);
      const result = await assessmentService.submitAnswer(
        req.params.id,
        authReq.user.userId,
        questionId,
        answer,
        selectedOption
      );

      res.json({ message: 'Answer submitted', result });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswers(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { answers } = submitAnswersSchema.parse(req.body);

      for (const ans of answers) {
        await assessmentService.submitAnswer(
          req.params.id,
          authReq.user.userId,
          ans.questionId,
          ans.answer,
          ans.selectedOption
        );
      }

      res.json({ message: 'Answers submitted', count: answers.length });
    } catch (error) {
      next(error);
    }
  }

  async completeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const session = await assessmentService.completeSession(req.params.id, authReq.user.userId);
      res.json({
        message: 'Assessment completed',
        session,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionResult(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await assessmentService.getSessionResult(req.params.id, authReq.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const sessions = await assessmentService.getUserSessions(authReq.user.userId);
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  }

  async logViolation(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { type } = req.body;
      const result = await assessmentService.logViolation(
        req.params.id,
        authReq.user.userId,
        type
      );

      res.json({ message: 'Violation logged', result });
    } catch (error) {
      next(error);
    }
  }

  async uploadSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { imageUrl } = req.body;
      if (!imageUrl) {
        throw new AppError('imageUrl is required', 400);
      }

      const snapshot = await assessmentService.saveSnapshot(
        req.params.id,
        authReq.user.userId,
        imageUrl
      );

      res.status(201).json(snapshot);
    } catch (error) {
      next(error);
    }
  }
}

export const assessmentController = new AssessmentController();
