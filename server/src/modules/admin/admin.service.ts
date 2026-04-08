import prisma from '../../config/database';

export class AdminService {
    async getStats() {
        const [userCount, assessmentCount, questionCount, resumeCount] = await Promise.all([
            prisma.user.count(),
            prisma.assessmentSession.count({ where: { status: 'COMPLETED' } }),
            prisma.question.count({ where: { isActive: true } }),
            prisma.resume.count({ where: { status: 'PARSED' } }),
        ]);

        return { userCount, assessmentCount, questionCount, resumeCount };
    }

    async getUsers() {
        return prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getQuestions(skillId?: string) {
        const where: any = { isActive: true };
        if (skillId) where.skillId = skillId;
        return prisma.question.findMany({
            where,
            include: { skill: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getSkills() {
        return prisma.skillCategory.findMany({
            include: {
                skills: {
                    include: {
                        _count: { select: { questions: true, resumeSkills: true } }
                    }
                }
            }
        });
    }

    async createSkillCategory(name: string, description?: string) {
        return prisma.skillCategory.create({
            data: { name, description },
            include: { skills: true }
        });
    }

    async deleteSkillCategory(id: string) {
        return prisma.skillCategory.delete({ where: { id } });
    }

    async updateUserRole(id: string, role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN') {
        return prisma.user.update({ where: { id }, data: { role } });
    }

    async deleteQuestion(id: string) {
        return prisma.question.update({
            where: { id },
            data: { isActive: false }
        });
    }

    async getAnalytics() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalUsers,
            totalCandidates,
            totalRecruiters,
            completedSessions,
            avgScoreResult,
            topSkills,
            recentSessions,
            allScores,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'CANDIDATE' } }),
            prisma.user.count({ where: { role: 'RECRUITER' } }),
            prisma.assessmentSession.count({ where: { status: 'COMPLETED' } }),
            prisma.assessmentSession.aggregate({
                where: { status: 'COMPLETED', overallScore: { not: null } },
                _avg: { overallScore: true },
            }),
            prisma.resumeSkill.groupBy({
                by: ['skillId'],
                _count: { skillId: true },
                orderBy: { _count: { skillId: 'desc' } },
                take: 10,
            }),
            prisma.assessmentSession.findMany({
                where: { status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
                select: { completedAt: true, overallScore: true },
                orderBy: { completedAt: 'asc' },
            }),
            prisma.assessmentSession.findMany({
                where: { status: 'COMPLETED', overallScore: { not: null } },
                select: { overallScore: true },
            }),
        ]);

        // Fetch skill names for top skills
        const skillIds = topSkills.map((s: any) => s.skillId);
        const skills = await prisma.skill.findMany({
            where: { id: { in: skillIds } },
            select: { id: true, name: true },
        });
        const skillMap = Object.fromEntries(skills.map((s: any) => [s.id, s.name]));

        // Group sessions by day
        const sessionsByDay: Record<string, number> = {};
        const scoresByDay: Record<string, number[]> = {};
        recentSessions.forEach((s: any) => {
            if (!s.completedAt) return;
            const day = s.completedAt.toISOString().split('T')[0];
            sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
            if (s.overallScore !== null) {
                if (!scoresByDay[day]) scoresByDay[day] = [];
                scoresByDay[day].push(s.overallScore);
            }
        });

        const dailyStats = Object.entries(sessionsByDay).map(([date, count]: [string, number]) => ({
            date,
            assessments: count,
            avgScore: scoresByDay[date]
                ? Math.round(scoresByDay[date].reduce((a: number, b: number) => a + b, 0) / scoresByDay[date].length)
                : 0,
        }));

        // Score distribution buckets
        const distribution: Record<string, number> = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
        allScores.forEach((s: any) => {
            const score = s.overallScore!;
            if (score <= 25) distribution['0-25']++;
            else if (score <= 50) distribution['26-50']++;
            else if (score <= 75) distribution['51-75']++;
            else distribution['76-100']++;
        });

        return {
            overview: {
                totalUsers,
                totalCandidates,
                totalRecruiters,
                completedSessions,
                averageScore: Math.round((avgScoreResult._avg.overallScore || 0) * 100) / 100,
            },
            topSkills: topSkills.map((s: any) => ({
                name: skillMap[s.skillId] || 'Unknown',
                count: s._count.skillId,
            })),
            dailyStats,
            scoreDistribution: Object.entries(distribution).map(([range, count]) => ({ range, count })),
        };
    }
}

export const adminService = new AdminService();
