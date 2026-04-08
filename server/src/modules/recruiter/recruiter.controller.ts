import { Request, Response, NextFunction } from 'express';
import { recruiterService } from './recruiter.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/error.middleware';

export class RecruiterController {
    async getCandidates(req: Request, res: Response, next: NextFunction) {
        try {
            const { query, skills } = req.query;
            const skillsArr = typeof skills === 'string' ? skills.split(',') : (Array.isArray(skills) ? skills as string[] : undefined);
            const candidates = await recruiterService.getCandidates(query as string, skillsArr);
            res.json(candidates);
        } catch (error) {
            next(error);
        }
    }

    async getCandidateDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const candidate = await recruiterService.getCandidateDetails(req.params.id);
            res.json(candidate);
        } catch (error) {
            next(error);
        }
    }

    async downloadCandidateResume(req: Request, res: Response, next: NextFunction) {
        try {
            const { filePath, fileName } = await recruiterService.getCandidateResumeFile(req.params.id);
            res.download(filePath, fileName);
        } catch (error) {
            next(error);
        }
    }

    async addToShortlist(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            if (!authReq.user) throw new AppError('Unauthorized', 401);
            const { candidateId, notes } = req.body;
            const result = await recruiterService.addToShortlist(authReq.user.userId, candidateId, notes);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async removeFromShortlist(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            if (!authReq.user) throw new AppError('Unauthorized', 401);
            await recruiterService.removeFromShortlist(authReq.user.userId, req.params.id);
            res.json({ message: 'Removed from shortlist' });
        } catch (error) {
            next(error);
        }
    }

    async getShortlist(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            if (!authReq.user) throw new AppError('Unauthorized', 401);
            const shortlist = await recruiterService.getShortlist(authReq.user.userId);
            res.json(shortlist);
        } catch (error) {
            next(error);
        }
    }

    // ─── Question Bank ────────────────────────────────────────────────────────

    async getQuestionBank(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            if (!authReq.user) throw new AppError('Unauthorized', 401);
            const questions = await recruiterService.getQuestionBank(authReq.user.userId, req.params.roomId);
            res.json(questions);
        } catch (error) {
            next(error);
        }
    }

    async addToQuestionBank(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            if (!authReq.user) throw new AppError('Unauthorized', 401);
            const question = await recruiterService.addQuestionToBank(
                authReq.user.userId,
                req.params.roomId,
                req.body
            );
            res.status(201).json(question);
        } catch (error) {
            next(error);
        }
    }

    async deleteFromQuestionBank(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            if (!authReq.user) throw new AppError('Unauthorized', 401);
            await recruiterService.deleteFromQuestionBank(authReq.user.userId, req.params.questionId);
            res.json({ message: 'Question removed from bank' });
        } catch (error) {
            next(error);
        }
    }

    async getCsvTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const csvContent = `Skill,Type,Difficulty,Prompt,Option1,Option2,Option3,Option4,CorrectOptionIndex,IdealAnswer,KeyPoints
Python,MCQ,MEDIUM,What is the keyword for defining a function in Python?,def,function,func,define,0,,
Docker,SUBJECTIVE,HARD,Explain the difference between a container and an image.,,,,,,,An image is a static blueprint. A container is a running instance of an image.,blueprint;running instance`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=truth_finder_qb_template.csv');
            res.status(200).send(csvContent);
        } catch (error) {
            next(error);
        }
    }

    async uploadCsvQuestionBank(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            if (!authReq.user) throw new AppError('Unauthorized', 401);
            if (!req.file) throw new AppError('No CSV file uploaded', 400);

            const result = await recruiterService.addQuestionsFromCsv(
                authReq.user.userId,
                req.params.roomId,
                req.file.path
            );
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export const recruiterController = new RecruiterController();
