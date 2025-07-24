import { PrismaClient } from '@prisma/client';
import { GeminiEmbeddingService } from './gemini-embedding.service';

interface EvaluationStats {
  avgSkillScore: number;
  avgWillScore: number;
  avgMindScore: number;
  totalEvaluations: number;
}

interface MatchResult {
  candidateId: string;
  matchScore: number;
  breakdown: {
    similarity: number;
    evaluationScore: number;
    skillMatch: number;
  };
  reasoning: string[];
}

export class MatchingService {
  private prisma: PrismaClient;
  private embeddingService: GeminiEmbeddingService;
  
  constructor(prisma: PrismaClient, embeddingService: GeminiEmbeddingService) {
    this.prisma = prisma;
    this.embeddingService = embeddingService;
  }

  // 候補者のマッチ率を算出
  async calculateMatchScore(
    candidateId: string,
    similarCandidates: Array<{ id: string; similarity: number }>
  ): Promise<MatchResult> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { evaluations: true }
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // 類似候補者の評価データを取得
    const similarCandidateIds = similarCandidates.map(c => c.id);
    const similarEvaluations = await this.prisma.evaluation.findMany({
      where: { candidateId: { in: similarCandidateIds } }
    });

    // 評価スコアの重み付き平均を計算
    const evaluationStats = this.calculateWeightedEvaluationStats(
      similarCandidates,
      similarEvaluations
    );

    // スキルマッチ度を計算
    const skillMatchScore = await this.calculateSkillMatchScore(
      candidate.skills,
      similarCandidateIds
    );

    // 総合マッチ率を算出
    const similarityScore = this.calculateAverageSimilarity(similarCandidates);
    const evaluationScore = this.calculateEvaluationScore(evaluationStats);
    
    const matchScore = this.calculateFinalMatchScore({
      similarity: similarityScore,
      evaluationScore,
      skillMatch: skillMatchScore
    });

    // 推論理由を生成
    const reasoning = this.generateReasoning(
      similarityScore,
      evaluationScore,
      skillMatchScore,
      evaluationStats
    );

    return {
      candidateId,
      matchScore,
      breakdown: {
        similarity: Math.round(similarityScore * 100) / 100,
        evaluationScore: Math.round(evaluationScore * 100) / 100,
        skillMatch: Math.round(skillMatchScore * 100) / 100
      },
      reasoning
    };
  }

  // 重み付き評価統計を計算
  private calculateWeightedEvaluationStats(
    similarCandidates: Array<{ id: string; similarity: number }>,
    evaluations: any[]
  ): EvaluationStats {
    const weightedStats = {
      skillScoreSum: 0,
      willScoreSum: 0,
      mindScoreSum: 0,
      weightSum: 0,
      totalEvaluations: 0
    };

    similarCandidates.forEach(candidate => {
      const candidateEvaluations = evaluations.filter(
        e => e.candidateId === candidate.id
      );

      candidateEvaluations.forEach(evaluation => {
        const weight = candidate.similarity;
        weightedStats.skillScoreSum += evaluation.skillScore * weight;
        weightedStats.willScoreSum += evaluation.willScore * weight;
        weightedStats.mindScoreSum += evaluation.mindScore * weight;
        weightedStats.weightSum += weight;
        weightedStats.totalEvaluations++;
      });
    });

    if (weightedStats.weightSum === 0) {
      return {
        avgSkillScore: 1,
        avgWillScore: 1,
        avgMindScore: 1,
        totalEvaluations: 0
      };
    }

    return {
      avgSkillScore: weightedStats.skillScoreSum / weightedStats.weightSum,
      avgWillScore: weightedStats.willScoreSum / weightedStats.weightSum,
      avgMindScore: weightedStats.mindScoreSum / weightedStats.weightSum,
      totalEvaluations: weightedStats.totalEvaluations
    };
  }

  // スキルマッチ度を計算
  private async calculateSkillMatchScore(
    candidateSkills: string[],
    similarCandidateIds: string[]
  ): Promise<number> {
    const similarCandidates = await this.prisma.candidate.findMany({
      where: { id: { in: similarCandidateIds } },
      select: { skills: true }
    });

    const allSkills = new Set<string>();
    similarCandidates.forEach(c => {
      c.skills.forEach(skill => allSkills.add(skill));
    });

    const matchingSkills = candidateSkills.filter(
      skill => allSkills.has(skill)
    );

    return allSkills.size > 0 ? matchingSkills.length / allSkills.size : 0;
  }

  // 平均類似度を計算
  private calculateAverageSimilarity(
    similarCandidates: Array<{ similarity: number }>
  ): number {
    if (similarCandidates.length === 0) return 0;
    
    const sum = similarCandidates.reduce(
      (acc, candidate) => acc + candidate.similarity, 
      0
    );
    
    return sum / similarCandidates.length;
  }

  // 評価スコアを計算（0-1の範囲に正規化）
  private calculateEvaluationScore(stats: EvaluationStats): number {
    if (stats.totalEvaluations === 0) return 0.5; // デフォルト値

    // 各評価の重み（0-2の値を0-1に正規化）
    const skillWeight = 0.4;
    const willWeight = 0.4;
    const mindWeight = 0.2;

    const normalizedScore = 
      (stats.avgSkillScore / 2) * skillWeight +
      (stats.avgWillScore / 2) * willWeight +
      (stats.avgMindScore / 2) * mindWeight;

    // 評価数による信頼度補正
    const confidenceFactor = Math.min(stats.totalEvaluations / 10, 1);
    
    return normalizedScore * confidenceFactor + 0.5 * (1 - confidenceFactor);
  }

  // 最終マッチ率を算出
  private calculateFinalMatchScore(breakdown: {
    similarity: number;
    evaluationScore: number;
    skillMatch: number;
  }): number {
    // 各要素の重み
    const weights = {
      similarity: 0.3,
      evaluationScore: 0.5,
      skillMatch: 0.2
    };

    const score = 
      breakdown.similarity * weights.similarity +
      breakdown.evaluationScore * weights.evaluationScore +
      breakdown.skillMatch * weights.skillMatch;

    return Math.round(score * 100); // 0-100のパーセンテージで返す
  }

  // 推論理由を生成
  private generateReasoning(
    similarity: number,
    evaluationScore: number,
    skillMatch: number,
    stats: EvaluationStats
  ): string[] {
    const reasoning: string[] = [];

    // 類似度に基づく理由
    if (similarity > 0.8) {
      reasoning.push('過去の非常に類似した候補者との比較に基づいています');
    } else if (similarity > 0.6) {
      reasoning.push('過去の類似候補者との比較に基づいています');
    }

    // 評価スコアに基づく理由
    if (evaluationScore > 0.7) {
      reasoning.push('類似候補者は高い評価を受けています');
    } else if (evaluationScore < 0.3) {
      reasoning.push('類似候補者の評価は低めでした');
    }

    // スキルに基づく理由
    if (skillMatch > 0.8) {
      reasoning.push('必要なスキルセットと高いマッチ度を示しています');
    } else if (skillMatch < 0.4) {
      reasoning.push('スキルセットのマッチ度は改善の余地があります');
    }

    // 評価の詳細
    if (stats.avgSkillScore > 1.5) {
      reasoning.push('技術スキルは高く評価される傾向があります');
    }
    if (stats.avgWillScore > 1.5) {
      reasoning.push('成長意欲・やる気は高く評価される傾向があります');
    }

    return reasoning;
  }
}