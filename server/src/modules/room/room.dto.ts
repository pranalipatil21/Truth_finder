import { z } from 'zod';

export const createRoomSchema = z.object({
    name: z.string().min(3, 'Room name must be at least 3 characters'),
    candidateIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid candidate ID')).min(1, 'At least one candidate must be shortlisted'),
    startTime: z.string().datetime().optional(),
    deadline: z.string().datetime().optional(),
    durationLimit: z.number().int().min(5).max(180).optional(),
    strictProctoring: z.boolean().optional(),
});

export const joinRoomSchema = z.object({
    roomCode: z.string().length(6, 'Room code must be exactly 6 characters'),
});

export interface LeaderboardEntry {
    userId: string;
    name: string;
    status: string;
    truthScore: number | null;
    progress: number;
}
