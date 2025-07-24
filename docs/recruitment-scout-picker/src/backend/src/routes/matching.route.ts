import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { GeminiEmbeddingService } from '../services/gemini-embedding.service';
import { QdrantService } from '../services/qdrant.service';
import { MatchingService } from '../services/matching.service';

const prisma = new PrismaClient();
const embeddingService = new GeminiEmbeddingService(process.env.GEMINI_API_KEY || '');
const qdrantService = new QdrantService(
  process.env.QDRANT_URL || 'http://localhost:6333',
  process.env.QDRANT_COLLECTION || 'candidates'
);
const matchingService = new MatchingService(prisma, embeddingService);

const matchingRoute: FastifyPluginAsync = async (server) => {
  // 候補者のマッチ率を算出
  server.post('/calculate/:candidateId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          candidateId: { type: 'string', format: 'uuid' }
        },
        required: ['candidateId']
      },
      body: {
        type: 'object',
        properties: {
          similarCandidatesLimit: { type: 'number', minimum: 5, maximum: 50, default: 10 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            candidateId: { type: 'string' },
            matchScore: { type: 'number' },
            breakdown: {
              type: 'object',
              properties: {
                similarity: { type: 'number' },
                evaluationScore: { type: 'number' },
                skillMatch: { type: 'number' }
              }
            },
            reasoning: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      },
      tags: ['matching']
    }
  }, async (request, reply) => {
    const { candidateId } = request.params as { candidateId: string };
    const { similarCandidatesLimit = 10 } = request.body as any;

    try {
      // 候補者を取得
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId }
      });

      if (!candidate) {
        return reply.code(404).send({ error: '候補者が見つかりません' });
      }

      // ベクトルが存在しない場合は生成
      let embedding = candidate.embedding;
      if (!embedding || embedding.length === 0) {
        const candidateText = embeddingService.formatCandidateText(candidate);
        embedding = await embeddingService.createEmbedding(candidateText);
        
        // データベースとQdrantを更新
        await prisma.candidate.update({
          where: { id: candidateId },
          data: { embedding }
        });
        
        await qdrantService.upsertPoint({
          id: candidateId,
          vector: embedding,
          payload: {
            name: candidate.name,
            skills: candidate.skills,
            currentRole: candidate.currentRole,
            source: candidate.source
          }
        });
      }

      // 類似候補者を検索
      const searchResults = await qdrantService.searchSimilar(
        embedding,
        similarCandidatesLimit + 1 // 自分自身を除外するため+1
      );

      // 自分自身を除外
      const similarCandidates = searchResults
        .filter(result => result.id !== candidateId)
        .map(result => ({
          id: result.id,
          similarity: result.score
        }));

      // マッチ率を算出
      const matchResult = await matchingService.calculateMatchScore(
        candidateId,
        similarCandidates
      );

      // 結果をデータベースに保存
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { matchScore: matchResult.matchScore }
      });

      return matchResult;
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ 
        error: 'マッチ率の算出中にエラーが発生しました' 
      });
    }
  });

  // 一括マッチ率算出
  server.post('/calculate-batch', {
    schema: {
      body: {
        type: 'object',
        properties: {
          candidateIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 50
          },
          similarCandidatesLimit: { type: 'number', minimum: 5, maximum: 50, default: 10 }
        },
        required: ['candidateIds']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  candidateId: { type: 'string' },
                  matchScore: { type: 'number' },
                  success: { type: 'boolean' },
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      },
      tags: ['matching']
    }
  }, async (request, reply) => {
    const { candidateIds, similarCandidatesLimit = 10 } = request.body as any;
    
    const results = await Promise.all(
      candidateIds.map(async (candidateId: string) => {
        try {
          // 各候補者のマッチ率を算出（上記のロジックを再利用）
          const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId }
          });

          if (!candidate) {
            return {
              candidateId,
              success: false,
              error: '候補者が見つかりません'
            };
          }

          let embedding = candidate.embedding;
          if (!embedding || embedding.length === 0) {
            const candidateText = embeddingService.formatCandidateText(candidate);
            embedding = await embeddingService.createEmbedding(candidateText);
            
            await prisma.candidate.update({
              where: { id: candidateId },
              data: { embedding }
            });
            
            await qdrantService.upsertPoint({
              id: candidateId,
              vector: embedding,
              payload: {
                name: candidate.name,
                skills: candidate.skills,
                currentRole: candidate.currentRole,
                source: candidate.source
              }
            });
          }

          const searchResults = await qdrantService.searchSimilar(
            embedding,
            similarCandidatesLimit + 1
          );

          const similarCandidates = searchResults
            .filter(result => result.id !== candidateId)
            .map(result => ({
              id: result.id,
              similarity: result.score
            }));

          const matchResult = await matchingService.calculateMatchScore(
            candidateId,
            similarCandidates
          );

          await prisma.candidate.update({
            where: { id: candidateId },
            data: { matchScore: matchResult.matchScore }
          });

          return {
            candidateId,
            matchScore: matchResult.matchScore,
            success: true
          };
        } catch (error) {
          server.log.error(error);
          return {
            candidateId,
            success: false,
            error: 'マッチ率の算出に失敗しました'
          };
        }
      })
    );

    return { results };
  });
};

export default matchingRoute;