interface SkillScoreInput {
  mcqCorrect: number;
  mcqTotal: number;
  subjectiveScores: number[]; // Each score is 0-10
  claimedLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
}

interface SkillScoreResult {
  mcqScore: number;      // 0-100
  subjectiveScore: number; // 0-100
  truthScore: number;     // 0-100
  penaltyApplied: boolean;
}

const LEVEL_WEIGHTS = {
  BEGINNER: 0.8,
  INTERMEDIATE: 1.0,
  EXPERT: 1.2,
};

const PENALTY_THRESHOLDS = {
  EXPERT: 60,      // Expert claim with <60% score gets penalty
  INTERMEDIATE: 40, // Intermediate claim with <40% score gets penalty
  BEGINNER: 20,     // Beginner claim with <20% score gets penalty
};

export function calculateSkillTruthScore(input: SkillScoreInput): SkillScoreResult {
  const { mcqCorrect, mcqTotal, subjectiveScores, claimedLevel } = input;

  // Calculate MCQ score (0-100)
  const mcqScore = mcqTotal > 0 ? (mcqCorrect / mcqTotal) * 100 : 0;

  // Calculate subjective score (0-100)
  const avgSubjective = subjectiveScores.length > 0
    ? subjectiveScores.reduce((a, b) => a + b, 0) / subjectiveScores.length
    : 0;
  const subjectiveScore = avgSubjective * 10; // Convert 0-10 to 0-100

  // Combined score (100% MCQ if no subjective, else 50/50 split)
  let combinedScore = mcqScore;
  if (subjectiveScores.length > 0) {
    combinedScore = (mcqScore * 0.5) + (subjectiveScore * 0.5);
  }

  // Apply penalty for overclaiming
  let penaltyApplied = false;
  const threshold = PENALTY_THRESHOLDS[claimedLevel];

  if (combinedScore < threshold) {
    // Apply penalty based on claimed level
    const levelWeight = LEVEL_WEIGHTS[claimedLevel];
    const penaltyFactor = Math.max(0.5, 1 - ((threshold - combinedScore) / 100) * levelWeight);
    combinedScore = combinedScore * penaltyFactor;
    penaltyApplied = true;
  }

  return {
    mcqScore: Math.round(mcqScore * 100) / 100,
    subjectiveScore: Math.round(subjectiveScore * 100) / 100,
    truthScore: Math.round(combinedScore * 100) / 100,
    penaltyApplied,
  };
}

interface AuthenticityScoreInput {
  skillScores: {
    skillId: string;
    truthScore: number;
    claimedLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
    yearsExperience?: number;
  }[];
}

interface AuthenticityScoreResult {
  authenticityScore: number; // 0-100
  tier: 'HIGHLY_AUTHENTIC' | 'MOSTLY_ACCURATE' | 'PARTIALLY_VERIFIED' | 'SIGNIFICANT_DISCREPANCIES' | 'UNVERIFIED';
  breakdown: {
    skillId: string;
    weight: number;
    contribution: number;
  }[];
}

export function calculateAuthenticityScore(input: AuthenticityScoreInput): AuthenticityScoreResult {
  const { skillScores } = input;

  if (skillScores.length === 0) {
    // No skills extracted — this is a parsing failure, not dishonesty. Use UNVERIFIED tier.
    return {
      authenticityScore: 0,
      tier: 'UNVERIFIED',
      breakdown: [],
    };
  }

  // Calculate weights based on claimed level and experience
  const weightedScores = skillScores.map(skill => {
    let weight = LEVEL_WEIGHTS[skill.claimedLevel];

    // Add weight for years of experience
    if (skill.yearsExperience) {
      weight += Math.min(skill.yearsExperience * 0.1, 0.5); // Max 0.5 bonus
    }

    return {
      skillId: skill.skillId,
      weight,
      score: skill.truthScore,
      contribution: 0,
    };
  });

  const totalWeight = weightedScores.reduce((sum, s) => sum + s.weight, 0);

  // Calculate weighted average
  let authenticityScore = 0;
  const breakdown = weightedScores.map(skill => {
    const normalizedWeight = skill.weight / totalWeight;
    const contribution = skill.score * normalizedWeight;
    authenticityScore += contribution;

    return {
      skillId: skill.skillId,
      weight: Math.round(normalizedWeight * 100) / 100,
      contribution: Math.round(contribution * 100) / 100,
    };
  });

  authenticityScore = Math.round(authenticityScore * 100) / 100;

  // Determine tier
  let tier: AuthenticityScoreResult['tier'];
  if (authenticityScore >= 85) {
    tier = 'HIGHLY_AUTHENTIC';
  } else if (authenticityScore >= 65) {
    tier = 'MOSTLY_ACCURATE';
  } else if (authenticityScore >= 40) {
    tier = 'PARTIALLY_VERIFIED';
  } else {
    tier = 'SIGNIFICANT_DISCREPANCIES';
  }

  return {
    authenticityScore,
    tier,
    breakdown,
  };
}

export function getTierBadgeColor(tier: AuthenticityScoreResult['tier']): string {
  switch (tier) {
    case 'HIGHLY_AUTHENTIC':
      return 'green';
    case 'MOSTLY_ACCURATE':
      return 'yellow';
    case 'PARTIALLY_VERIFIED':
      return 'orange';
    case 'SIGNIFICANT_DISCREPANCIES':
      return 'red';
    case 'UNVERIFIED':
      return 'gray';
    default:
      return 'gray';
  }
}
