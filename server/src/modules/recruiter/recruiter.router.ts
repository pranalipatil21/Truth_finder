import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRecruiter } from '../../middleware/role.middleware';
import { recruiterController } from './recruiter.controller';
import { uploadCsv } from '../../middleware/upload.middleware';

const router = Router();

router.use(authenticate, requireRecruiter);

// Candidates
router.get('/candidates', (req, res, next) => recruiterController.getCandidates(req, res, next));
router.get('/candidates/:id', (req, res, next) => recruiterController.getCandidateDetails(req, res, next));
router.get('/candidates/:id/resume/download', (req, res, next) => recruiterController.downloadCandidateResume(req, res, next));

// Shortlist
router.get('/shortlist', (req, res, next) => recruiterController.getShortlist(req, res, next));
router.post('/shortlist', (req, res, next) => recruiterController.addToShortlist(req, res, next));
router.delete('/shortlist/:id', (req, res, next) => recruiterController.removeFromShortlist(req, res, next));

// Question Bank (QB) — scoped to a specific room
router.get('/rooms/:roomId/questions', (req, res, next) => recruiterController.getQuestionBank(req, res, next));
router.post('/rooms/:roomId/questions', (req, res, next) => recruiterController.addToQuestionBank(req, res, next));
router.get('/questions/csv/template', (req, res, next) => recruiterController.getCsvTemplate(req, res, next));
router.post('/rooms/:roomId/questions/csv', uploadCsv, (req, res, next) => recruiterController.uploadCsvQuestionBank(req, res, next));
router.delete('/rooms/:roomId/questions/:questionId', (req, res, next) => recruiterController.deleteFromQuestionBank(req, res, next));

export default router;
