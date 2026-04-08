import { Router } from 'express';
import { assessmentController } from './assessment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireCandidate } from '../../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.post('/sessions', requireCandidate, (req, res, next) =>
  assessmentController.createSession(req, res, next)
);

router.get('/sessions', requireCandidate, (req, res, next) =>
  assessmentController.getUserSessions(req, res, next)
);

router.get('/sessions/progress/:resumeId', requireCandidate, (req, res, next) =>
  assessmentController.getCreationProgress(req, res, next)
);

router.get('/sessions/:id', requireCandidate, (req, res, next) =>
  assessmentController.getSession(req, res, next)
);

router.post('/sessions/:id/start', requireCandidate, (req, res, next) =>
  assessmentController.startSession(req, res, next)
);

router.post('/sessions/:id/answers', requireCandidate, (req, res, next) =>
  assessmentController.submitAnswers(req, res, next)
);

router.post('/sessions/:id/complete', requireCandidate, (req, res, next) =>
  assessmentController.completeSession(req, res, next)
);

router.get('/sessions/:id/result', requireCandidate, (req, res, next) =>
  assessmentController.getSessionResult(req, res, next)
);

router.post('/sessions/:id/violation', requireCandidate, (req, res, next) =>
  assessmentController.logViolation(req, res, next)
);

router.post('/sessions/:id/snapshots', requireCandidate, (req, res, next) =>
  assessmentController.uploadSnapshot(req, res, next)
);

export default router;
