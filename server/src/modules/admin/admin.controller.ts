import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';

export class AdminController {
    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await adminService.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await adminService.getUsers();
            res.json(users);
        } catch (error) {
            next(error);
        }
    }

    async getQuestions(req: Request, res: Response, next: NextFunction) {
        try {
            const { skillId } = req.query;
            const questions = await adminService.getQuestions(skillId as string);
            res.json(questions);
        } catch (error) {
            next(error);
        }
    }

    async getSkills(req: Request, res: Response, next: NextFunction) {
        try {
            const skills = await adminService.getSkills();
            res.json(skills);
        } catch (error) {
            next(error);
        }
    }

    async createSkillCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, description } = req.body;
            const category = await adminService.createSkillCategory(name, description);
            res.status(201).json(category);
        } catch (error) {
            next(error);
        }
    }

    async deleteSkillCategory(req: Request, res: Response, next: NextFunction) {
        try {
            await adminService.deleteSkillCategory(req.params.id);
            res.json({ message: 'Skill category deleted' });
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { role } = req.body;
            const user = await adminService.updateUserRole(req.params.id, role);
            res.json(user);
        } catch (error) {
            next(error);
        }
    }

    async deleteQuestion(req: Request, res: Response, next: NextFunction) {
        try {
            await adminService.deleteQuestion(req.params.id);
            res.json({ message: 'Question deactivated' });
        } catch (error) {
            next(error);
        }
    }

    async getAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const analytics = await adminService.getAnalytics();
            res.json(analytics);
        } catch (error) {
            next(error);
        }
    }
}

export const adminController = new AdminController();
