import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const skill = await prisma.skill.findFirst({ where: { name: 'Twitter API' } });
    if (skill) {
        const questions = await prisma.question.findMany({ where: { skillId: skill.id } });
        for (const q of questions) {
            console.log(`[${q.type}] ${q.promptText}`);
            console.log(JSON.stringify(q.options, null, 2));
        }
    } else {
        console.log('Skill not found');
    }
}
main().finally(() => prisma.$disconnect());
