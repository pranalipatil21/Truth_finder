const fs = require('fs');
let code = fs.readFileSync('server/src/modules/assessment/assessment.service.ts', 'utf8');

// 1. Add progressMap
code = code.replace('export class AssessmentService {', 'export class AssessmentService {\n  public generationProgress = new Map<string, { total: number; generated: number; message: string }>();');

// 2. Wrap createSession
code = code.replace(
`    // Generate questions for selected skills (targeting 10 total)
    await this.generateQuestionsForSession(session.id, sortedSkills, 10);

    return session;`,
`    // Generate questions for selected skills (targeting 10 total)
    let dynamicPoolTotal = 0;
    const questionsPerSkill = Math.floor(10 / sortedSkills.length);
    const remaining = 10 % sortedSkills.length;
    sortedSkills.forEach((_, index) => {
      const base = questionsPerSkill + (index < remaining ? 1 : 0);
      dynamicPoolTotal += Math.floor(base * 1.5);
    });

    this.generationProgress.set(resumeId, { total: dynamicPoolTotal, generated: 0, message: 'Initializing AI models...' });
    
    try {
      await this.generateQuestionsForSession(session.id, sortedSkills, 10, resumeId, dynamicPoolTotal);
    } finally {
      this.generationProgress.delete(resumeId);
    }

    return session;`
);

// 3. Update generateQuestionsForSession signature
code = code.replace(
`  private async generateQuestionsForSession(
    sessionId: string,
    resumeSkills: Array<{ skill: { id: string; name: string }; claimedLevel: string }>,
    targetTotal: number
  ) {`,
`  private async generateQuestionsForSession(
    sessionId: string,
    resumeSkills: Array<{ skill: { id: string; name: string }; claimedLevel: string }>,
    targetTotal: number,
    resumeId?: string,
    dynamicPoolTotal?: number
  ) {`
);

// 4. Update the inside loop
code = code.replace(
`        if (newMcqsNeeded > 0) {
          const result = await questionGenerator.generateMcqs(rs.skill.name, level, newMcqsNeeded);`,
`        if (newMcqsNeeded > 0) {
          if (resumeId) {
            const current = this.generationProgress.get(resumeId);
            if (current) this.generationProgress.set(resumeId, { ...current, message: \`Generating questions for \${rs.skill.name}...\` });
          }
          const result = await questionGenerator.generateMcqs(rs.skill.name, level, newMcqsNeeded);`
);

code = code.replace(
`            await prisma.question.createMany({
              data: mcqData,
            });
          }
        }`,
`            await prisma.question.createMany({
              data: mcqData,
            });
          }
        }
        
        if (resumeId) {
          const current = this.generationProgress.get(resumeId);
          if (current) {
             this.generationProgress.set(resumeId, { ...current, generated: current.generated + dynamicPoolCount });
          }
        }`
);

fs.writeFileSync('server/src/modules/assessment/assessment.service.ts', code);
