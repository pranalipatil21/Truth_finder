import { prisma } from './src/config/database';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function testConnection() {
    try {
        const count = await prisma.user.count();
        console.log(`Successfully connected to database. User count: ${count}`);
        process.exit(0);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

testConnection();
