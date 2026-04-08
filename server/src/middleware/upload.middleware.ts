import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AppError } from './error.middleware';
import { env } from '../config/env';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${crypto.randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new AppError('Only PDF and DOCX files are allowed', 400));
    return;
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new AppError('Only PDF and DOCX files are allowed', 400));
    return;
  }

  cb(null, true);
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(env.MAX_FILE_SIZE_MB, 10) * 1024 * 1024,
  },
}).single('resume');

const csvFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype !== 'text/csv' && ext !== '.csv') {
    cb(new AppError('Only CSV files are allowed', 400));
    return;
  }
  cb(null, true);
};

export const uploadCsv = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for CSV
  },
}).single('file');
