import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { LeaderboardEntry } from './room.dto';
import { customAlphabet } from 'nanoid';

const generateRoomCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export class RoomService {
    async createRoom(
        recruiterId: string, 
        name: string, 
        candidateIds: string[],
        options?: { startTime?: Date, deadline?: Date, durationLimit?: number, strictProctoring?: boolean }
    ) {
        // Check if candidates are valid
        const candidates = await prisma.user.findMany({
            where: { id: { in: candidateIds }, role: 'CANDIDATE' },
        });

        if (candidates.length === 0) {
            throw new AppError('No valid candidates found to invite', 400);
        }

        const roomCode = generateRoomCode();

        const room = await prisma.assessmentRoom.create({
            data: {
                recruiterId,
                name,
                roomCode,
                startTime: options?.startTime,
                deadline: options?.deadline,
                durationLimit: options?.durationLimit,
                strictProctoring: options?.strictProctoring ?? false,
                participants: {
                    create: candidates.map((c: any) => ({
                        userId: c.id,
                    })),
                },
            },
            include: {
                participants: {
                    include: { user: true },
                },
            },
        });

        return room;
    }

    async getRecruiterRooms(recruiterId: string) {
        return prisma.assessmentRoom.findMany({
            where: { recruiterId },
            include: {
                _count: {
                    select: { participants: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getRoomLeaderboard(roomId: string, recruiterId: string): Promise<LeaderboardEntry[]> {
        const room = await prisma.assessmentRoom.findFirst({
            where: { id: roomId, recruiterId },
            include: {
                participants: {
                    include: {
                        user: true,
                        sessions: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: {
                                status: true,
                                overallScore: true,
                                _count: {
                                    select: { sessionAnswers: true }
                                }
                            },
                        },
                    },
                },
            },
        });

        if (!room) {
            throw new AppError('Room not found', 404);
        }

        return room.participants.map((p: any) => {
            const latestSession = p.sessions[0];
            return {
                userId: p.user.id,
                name: p.user.name,
                status: latestSession?.status || 'NOT_STARTED',
                truthScore: latestSession?.overallScore || null,
                progress: latestSession ? (latestSession._count.sessionAnswers / 10) * 100 : 0,
            };
        }).sort((a: LeaderboardEntry, b: LeaderboardEntry) => (b.truthScore || 0) - (a.truthScore || 0));
    }

    async joinRoom(userId: string, roomCode: string) {
        const room = await prisma.assessmentRoom.findUnique({
            where: { roomCode, status: 'ACTIVE' },
        });

        if (!room) {
            throw new AppError('Invalid or inactive room code', 404);
        }

        const now = new Date();
        if (room.startTime && now < room.startTime) {
            throw new AppError(`This localized test does not begin until ${room.startTime.toLocaleString()}`, 403);
        }
        if (room.deadline && now > room.deadline) {
            throw new AppError('This localized test has already concluded', 403);
        }

        const participant = await prisma.roomParticipant.findUnique({
            where: {
                roomId_userId: {
                    roomId: room.id,
                    userId,
                },
            },
        });

        if (!participant) {
            throw new AppError('You are not invited to this room', 403);
        }

        // Check if user has a parsed resume
        const resume = await prisma.resume.findFirst({
            where: { userId, status: 'PARSED' },
            orderBy: { createdAt: 'desc' }
        });

        if (!resume) {
            throw new AppError('You must upload a resume before joining a room assessment.', 400);
        }

        return {
            roomId: room.id,
            roomName: room.name,
            participantId: participant.id,
            resumeId: resume.id
        };
    }
}

export const roomService = new RoomService();
