import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRecruiter } from '../../middleware/role.middleware';
import { roomController } from './room.controller';

const router = Router();

router.post('/', authenticate, requireRecruiter, (req, res, next) => roomController.createRoom(req, res, next));
router.get('/recruiter', authenticate, requireRecruiter, (req, res, next) => roomController.getRecruiterRooms(req, res, next));
router.get('/:id/leaderboard', authenticate, requireRecruiter, (req, res, next) => roomController.getRoomLeaderboard(req, res, next));
router.post('/join', authenticate, (req, res, next) => roomController.joinRoom(req, res, next));

export default router;
