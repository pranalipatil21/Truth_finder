import { Router } from 'express';
import { resumeController } from './resume.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireCandidate } from '../../middleware/role.middleware';
import { uploadResume } from '../../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/upload', requireCandidate, uploadResume, (req, res, next) => 
  resumeController.upload(req, res, next)
);

router.get('/', requireCandidate, (req, res, next) => 
  resumeController.getUserResumes(req, res, next)
);

router.get('/:id', requireCandidate, (req, res, next) => 
  resumeController.getResume(req, res, next)
);

router.get('/:id/skills', requireCandidate, (req, res, next) => 
  resumeController.getResumeSkills(req, res, next)
);

router.delete('/:id', requireCandidate, (req, res, next) => 
  resumeController.deleteResume(req, res, next)
);

export default router;
