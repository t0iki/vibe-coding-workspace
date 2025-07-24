import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { 
  candidateQuerySchema, 
  createCandidateSchema,
  updateCandidateSchema 
} from '../schemas/candidate.schema';

const prisma = new PrismaClient();

const candidatesRoute: FastifyPluginAsync = async (server) => {
  // 候補者一覧取得
  server.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
          source: { type: 'string', enum: ['youtrust', 'draft'] },
          search: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            candidates: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      },
      tags: ['candidates']
    }
  }, async (request, reply) => {
    const { page, limit, source, search } = request.query as any;
    
    const where: any = {};
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { currentRole: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } }
      ];
    }
    
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.candidate.count({ where })
    ]);
    
    return {
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  });
  
  // 候補者詳細取得
  server.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      tags: ['candidates']
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        evaluations: {
          include: {
            evaluator: true
          }
        }
      }
    });
    
    if (!candidate) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }
    
    return candidate;
  });
  
  // 候補者作成
  server.post('/', {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          yearsOfExp: { type: 'number' },
          currentRole: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          will: { type: 'string' },
          source: { type: 'string', enum: ['youtrust', 'draft'] },
          sourceUrl: { type: 'string' }
        },
        required: ['name', 'skills', 'source']
      },
      tags: ['candidates']
    }
  }, async (request, reply) => {
    const data = request.body as any;
    
    const candidate = await prisma.candidate.create({
      data: {
        ...data,
        embedding: [] // TODO: ベクトル化処理を実装
      }
    });
    
    return reply.code(201).send(candidate);
  });
  
  // 候補者更新
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
          name: { type: 'string' },
          age: { type: 'number' },
          yearsOfExp: { type: 'number' },
          currentRole: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          will: { type: 'string' },
          source: { type: 'string', enum: ['youtrust', 'draft'] },
          sourceUrl: { type: 'string' }
        }
      },
      tags: ['candidates']
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    
    try {
      const candidate = await prisma.candidate.update({
        where: { id },
        data
      });
      
      return candidate;
    } catch (error) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }
  });
  
  // 候補者削除
  server.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      tags: ['candidates']
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      await prisma.candidate.delete({
        where: { id }
      });
      
      return reply.code(204).send();
    } catch (error) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }
  });
};

export default candidatesRoute;