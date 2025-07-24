import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { 
  createEvaluationSchema,
  updateEvaluationSchema 
} from '../schemas/evaluation.schema';

const prisma = new PrismaClient();

const evaluationsRoute: FastifyPluginAsync = async (server) => {
  // 評価作成
  server.post('/', {
    schema: {
      body: {
        type: 'object',
        properties: {
          candidateId: { type: 'string', format: 'uuid' },
          skillScore: { type: 'number', minimum: 0, maximum: 2 },
          willScore: { type: 'number', minimum: 0, maximum: 2 },
          mindScore: { type: 'number', minimum: 0, maximum: 2 },
          comment: { type: 'string' }
        },
        required: ['candidateId', 'skillScore', 'willScore', 'mindScore']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            candidateId: { type: 'string' },
            evaluatorId: { type: 'string' },
            skillScore: { type: 'number' },
            willScore: { type: 'number' },
            mindScore: { type: 'number' },
            comment: { type: 'string', nullable: true },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      },
      tags: ['evaluations']
    }
  }, async (request, reply) => {
    const data = request.body as any;
    
    // TODO: 実際のアプリケーションでは認証から evaluatorId を取得
    const evaluatorId = 'temp-evaluator-id';
    
    try {
      // 既存の評価があるかチェック
      const existingEvaluation = await prisma.evaluation.findUnique({
        where: {
          candidateId_evaluatorId: {
            candidateId: data.candidateId,
            evaluatorId
          }
        }
      });
      
      if (existingEvaluation) {
        return reply.code(409).send({ 
          error: 'この候補者への評価は既に存在します' 
        });
      }
      
      // 評価者が存在しない場合は作成
      await prisma.evaluator.upsert({
        where: { id: evaluatorId },
        update: {},
        create: {
          id: evaluatorId,
          name: 'Temp Evaluator',
          email: 'temp@example.com'
        }
      });
      
      const evaluation = await prisma.evaluation.create({
        data: {
          ...data,
          evaluatorId,
          comment: data.comment || null
        },
        include: {
          evaluator: true
        }
      });
      
      return reply.code(201).send(evaluation);
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ 
        error: '評価の作成中にエラーが発生しました' 
      });
    }
  });
  
  // 候補者の評価一覧取得
  server.get('/candidate/:candidateId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          candidateId: { type: 'string', format: 'uuid' }
        },
        required: ['candidateId']
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              candidateId: { type: 'string' },
              evaluatorId: { type: 'string' },
              skillScore: { type: 'number' },
              willScore: { type: 'number' },
              mindScore: { type: 'number' },
              comment: { type: 'string', nullable: true },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              evaluator: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' }
                }
              }
            }
          }
        }
      },
      tags: ['evaluations']
    }
  }, async (request, reply) => {
    const { candidateId } = request.params as { candidateId: string };
    
    const evaluations = await prisma.evaluation.findMany({
      where: { candidateId },
      include: { evaluator: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return evaluations;
  });
  
  // 評価更新
  server.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          skillScore: { type: 'number', minimum: 0, maximum: 2 },
          willScore: { type: 'number', minimum: 0, maximum: 2 },
          mindScore: { type: 'number', minimum: 0, maximum: 2 },
          comment: { type: 'string' }
        }
      },
      tags: ['evaluations']
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    // TODO: 実際のアプリケーションでは評価者本人かチェック
    
    try {
      const evaluation = await prisma.evaluation.update({
        where: { id },
        data: {
          ...data,
          comment: data.comment !== undefined ? data.comment : undefined
        }
      });
      
      return evaluation;
    } catch (error) {
      return reply.code(404).send({ error: '評価が見つかりません' });
    }
  });
  
  // 評価削除
  server.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      tags: ['evaluations']
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    // TODO: 実際のアプリケーションでは評価者本人かチェック
    
    try {
      await prisma.evaluation.delete({
        where: { id }
      });
      
      return reply.code(204).send();
    } catch (error) {
      return reply.code(404).send({ error: '評価が見つかりません' });
    }
  });
};

export default evaluationsRoute;