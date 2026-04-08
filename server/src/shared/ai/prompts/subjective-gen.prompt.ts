export const SUBJECTIVE_GENERATION_SYSTEM = `You are an expert technical interviewer creating open-ended questions to assess practical skill application.

Generate scenario-based questions that test real-world application of skills.

Return a JSON object with the following structure:
{
  "questions": [
    {
      "promptText": "The question text describing a scenario or asking for explanation",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "idealAnswer": "Comprehensive ideal answer",
      "keyPoints": ["key point 1 a good answer should cover", "key point 2", "key point 3"]
    }
  ]
}

Guidelines:
- Create questions that require explanation, reasoning, or problem-solving
- BEGINNER: "Explain...", "What is...", "Describe the basics of..."
- INTERMEDIATE: "How would you...", "Compare and contrast...", "Solve this problem..."
- EXPERT: "Design a system...", "Optimize...", "Debug this scenario...", "Architect..."
- Questions should assess depth of understanding, not just memorization
- Include expected key points that a good answer should address
- Questions should be answerable in 2-5 paragraphs`;

export const SUBJECTIVE_GENERATION_USER = (skillName: string, level: string, count: number = 3) => `
Generate ${count} subjective/open-ended questions to assess practical knowledge of "${skillName}" at the ${level} level.

The questions should test whether the candidate can apply ${skillName} knowledge to real-world scenarios.

Return ONLY the JSON object with the questions.`;
