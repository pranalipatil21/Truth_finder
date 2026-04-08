import { Request, Response, NextFunction } from 'express';
import { roomService } from './room.service';
import { createRoomSchema, joinRoomSchema } from './room.dto';
import { AuthRequest } from '../../middleware/auth.middleware';

export class RoomController {
    async createRoom(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const data = createRoomSchema.parse(req.body);
            const room = await roomService.createRoom(
                authReq.user!.userId, 
                data.name, 
                data.candidateIds,
                {
                    startTime: data.startTime ? new Date(data.startTime) : undefined,
                    deadline: data.deadline ? new Date(data.deadline) : undefined,
                    durationLimit: data.durationLimit,
                    strictProctoring: data.strictProctoring
                }
            );
            res.status(201).json(room);
        } catch (error) {
            next(error);
        }
    }

    async getRecruiterRooms(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const rooms = await roomService.getRecruiterRooms(authReq.user!.userId);
            res.json(rooms);
        } catch (error) {
            next(error);
        }
    }

    async getRoomLeaderboard(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const leaderboard = await roomService.getRoomLeaderboard(req.params.id, authReq.user!.userId);
            res.json(leaderboard);
        } catch (error) {
            next(error);
        }
    }

    async joinRoom(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const data = joinRoomSchema.parse(req.body);
            const result = await roomService.joinRoom(authReq.user!.userId, data.roomCode);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export const roomController = new RoomController();
