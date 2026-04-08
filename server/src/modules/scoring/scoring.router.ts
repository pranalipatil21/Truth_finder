import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { scoringService } from './scoring.service';
import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

const router = Router();

router.use(authenticate);

router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const authReq = req as AuthRequest;
    
    // Quick lookup for resumeId
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const result = await scoringService.getResumeScore(session.resumeId, authReq.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/resume/:resumeId', async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const authReq = req as AuthRequest;
    const result = await scoringService.getResumeScore(resumeId, authReq.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/candidate/overview', async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const result = await scoringService.getCandidateOverview(authReq.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
