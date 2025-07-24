import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { GeminiEmbeddingService } from '../services/gemini-embedding.service';
import { QdrantService } from '../services/qdrant.service';

const prisma = new PrismaClient();
const embeddingService = new GeminiEmbeddingService(process.env.GEMINI_API_KEY || '');
const qdrantService = new QdrantService(
  process.env.QDRANT_URL || 'http://localhost:6333',
  process.env.QDRANT_COLLECTION || 'candidates'
);

const searchRoute: FastifyPluginAsync = async (server) => {
  // 類似候補者検索
  server.post('/similar', {
    schema: {
      body: {
        type: 'object',
        properties: {
          candidateId: { type: 'string', format: 'uuid' },
          text: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
          filters: {
            type: 'object',
            properties: {
              source: { type: 'string', enum: ['youtrust', 'draft'] },
              skills: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            candidates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  similarity: { type: 'number' },
                  skills: { type: 'array', items: { type: 'string' } },
                  currentRole: { type: 'string', nullable: true },
                  source: { type: 'string' }
                }
              }
            }
          }
        }
      },
      tags: ['search']
    }
  }, async (request, reply) => {
    const { candidateId, text, limit = 10, filters } = request.body as any;

    try {
      let embedding: number[];

      if (candidateId) {
        // 既存の候補者のベクトルを使用
        const candidate = await prisma.candidate.findUnique({
          where: { id: candidateId }
        });

        if (!candidate) {
          return reply.code(404).send({ error: '候補者が見つかりません' });
        }

        embedding = candidate.embedding;
      } else if (text) {
        // テキストからベクトルを生成
        embedding = await embeddingService.createEmbedding(text);
      } else {
        return reply.code(400).send({ 
          error: 'candidateIdまたはtextのいずれかを指定してください' 
        });
      }

      // Qdrantで類似検索
      const qdrantFilter: any = {};
      if (filters?.source) {
        qdrantFilter.source = filters.source;
      }
      if (filters?.skills && filters.skills.length > 0) {
        qdrantFilter.skills = { $in: filters.skills };
      }

      const searchResults = await qdrantService.searchSimilar(
        embedding,
        limit,
        Object.keys(qdrantFilter).length > 0 ? qdrantFilter : undefined
      );

      // 検索結果から候補者情報を取得
      const candidateIds = searchResults.map(result => result.id);
      const candidates = await prisma.candidate.findMany({
        where: { id: { in: candidateIds } }
      });

      // 類似度スコアとマージ
      const candidatesWithScore = searchResults.map(result => {
        const candidate = candidates.find(c => c.id === result.id);
        if (!candidate) return null;

        return {
          id: candidate.id,
          name: candidate.name,
          similarity: Math.round(result.score * 100) / 100,
          skills: candidate.skills,
          currentRole: candidate.currentRole,
          source: candidate.source
        };
      }).filter(Boolean);

      return { candidates: candidatesWithScore };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ 
        error: '類似候補者の検索中にエラーが発生しました' 
      });
    }
  });

  // スキルベース検索
  server.post('/by-skills', {
    schema: {
      body: {
        type: 'object',
        properties: {
          requiredSkills: { 
            type: 'array', 
            items: { type: 'string' },
            minItems: 1 
          },
          optionalSkills: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 20 }
        },
        required: ['requiredSkills']
      },
      tags: ['search']
    }
  }, async (request, reply) => {
    const { requiredSkills, optionalSkills = [], limit = 20 } = request.body as any;

    try {
      // 必須スキルをすべて持つ候補者を検索
      const candidates = await prisma.candidate.findMany({
        where: {
          skills: {
            hasEvery: requiredSkills
          }
        },
        take: limit
      });

      // スコアリング（オプションスキルの保有数でソート）
      const candidatesWithScore = candidates.map(candidate => {
        const matchedOptionalSkills = optionalSkills.filter(
          (skill: string) => candidate.skills.includes(skill)
        );

        return {
          ...candidate,
          matchScore: {
            required: requiredSkills.length,
            optional: matchedOptionalSkills.length,
            total: requiredSkills.length + matchedOptionalSkills.length
          }
        };
      });

      // スコアでソート
      candidatesWithScore.sort((a, b) => b.matchScore.total - a.matchScore.total);

      return { candidates: candidatesWithScore };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ 
        error: 'スキルベース検索中にエラーが発生しました' 
      });
    }
  });
};

export default searchRoute;