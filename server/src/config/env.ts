import { z } from 'zod';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database
  DATABASE_URL: z.string(),

  // JWT
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // AI Configuration
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required').optional(),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required').optional(),
  AI_MODEL: z.string().default('llama-3.3-70b-versatile'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  OAUTH_CALLBACK_BASE_URL: z.string().default('http://localhost:3000'),

  // Client
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // File Upload
  MAX_FILE_SIZE_MB: z.string().default('10'),
  UPLOAD_TEMP_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

console.log('Environment loaded. DATABASE_URL host:', new URL(parsed.data.DATABASE_URL).host);
export const env = parsed.data;
