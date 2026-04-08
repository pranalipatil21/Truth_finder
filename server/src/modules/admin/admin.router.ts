import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { adminController } from './admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

// Stats & Analytics
router.get('/stats', (req, res, next) => adminController.getStats(req, res, next));
router.get('/analytics', (req, res, next) => adminController.getAnalytics(req, res, next));

// Users
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.patch('/users/:id', (req, res, next) => adminController.updateUserRole(req, res, next));

// Questions
router.get('/questions', (req, res, next) => adminController.getQuestions(req, res, next));
router.delete('/questions/:id', (req, res, next) => adminController.deleteQuestion(req, res, next));

// Skills / Categories
router.get('/skills', (req, res, next) => adminController.getSkills(req, res, next));
router.post('/skills', (req, res, next) => adminController.createSkillCategory(req, res, next));
router.delete('/skills/:id', (req, res, next) => adminController.deleteSkillCategory(req, res, next));

export default router;
