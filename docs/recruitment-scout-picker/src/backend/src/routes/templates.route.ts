import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  CreateEvaluationTemplateSchema,
  UpdateEvaluationTemplateSchema,
  EvaluationTemplateResponseSchema,
  CreateEvaluationTemplateDto,
  UpdateEvaluationTemplateDto
} from '../schemas/evaluation-template.schema';

const prisma = new PrismaClient();

const templatesRoute: FastifyPluginAsync = async (fastify) => {
  // 評価テンプレート一覧取得
  fastify.get('/templates', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          position: { type: 'string' },
          createdById: { type: 'string' },
          isPublic: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: EvaluationTemplateResponseSchema
        }
      }
    }
  }, async (request, reply) => {
    const { position, createdById, isPublic } = request.query as any;
    
    const where: any = {};
    if (position) where.position = position;
    if (createdById) where.createdById = createdById;
    if (isPublic !== undefined) where.isPublic = isPublic;

    const templates = await prisma.evaluationTemplate.findMany({
      where,
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        createdBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return templates;
  });

  // 評価テンプレート詳細取得
  fastify.get('/templates/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: EvaluationTemplateResponseSchema
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const template = await prisma.evaluationTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        createdBy: true
      }
    });

    if (!template) {
      return reply.code(404).send({ error: 'Template not found' });
    }

    return template;
  });

  // 評価テンプレート作成
  fastify.post('/templates', {
    schema: {
      body: CreateEvaluationTemplateSchema,
      response: {
        201: EvaluationTemplateResponseSchema
      }
    }
  }, async (request, reply) => {
    const data = request.body as CreateEvaluationTemplateDto;
    
    // 仮の評価者IDを使用（実際は認証システムから取得）
    const evaluatorId = 'default-evaluator-id';
    
    // 評価者が存在しない場合は作成
    const evaluator = await prisma.evaluator.upsert({
      where: { id: evaluatorId },
      update: {},
      create: {
        id: evaluatorId,
        name: 'Default Evaluator',
        email: 'default@example.com'
      }
    });

    const template = await prisma.evaluationTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        position: data.position,
        skillWeight: data.skillWeight,
        willWeight: data.willWeight,
        mindWeight: data.mindWeight,
        isPublic: data.isPublic,
        createdById: evaluator.id,
        items: {
          create: data.items.map((item, index) => ({
            category: item.category,
            name: item.name,
            description: item.description,
            weight: item.weight,
            required: item.required,
            order: item.order ?? index
          }))
        }
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        createdBy: true
      }
    });

    return reply.code(201).send(template);
  });

  // 評価テンプレート更新
  fastify.put('/templates/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: UpdateEvaluationTemplateSchema,
      response: {
        200: EvaluationTemplateResponseSchema
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateEvaluationTemplateDto;

    const existingTemplate = await prisma.evaluationTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return reply.code(404).send({ error: 'Template not found' });
    }

    // itemsの更新がある場合は、既存のitemsを削除して新規作成
    if (data.items) {
      await prisma.evaluationTemplateItem.deleteMany({
        where: { templateId: id }
      });
    }

    const template = await prisma.evaluationTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.position && { position: data.position }),
        ...(data.skillWeight !== undefined && { skillWeight: data.skillWeight }),
        ...(data.willWeight !== undefined && { willWeight: data.willWeight }),
        ...(data.mindWeight !== undefined && { mindWeight: data.mindWeight }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.items && {
          items: {
            create: data.items.map((item, index) => ({
              category: item.category,
              name: item.name,
              description: item.description,
              weight: item.weight,
              required: item.required,
              order: item.order ?? index
            }))
          }
        })
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        createdBy: true
      }
    });

    return template;
  });

  // 評価テンプレート削除
  fastify.delete('/templates/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existingTemplate = await prisma.evaluationTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return reply.code(404).send({ error: 'Template not found' });
    }

    await prisma.evaluationTemplate.delete({
      where: { id }
    });

    return reply.code(204).send();
  });

  // 評価テンプレート複製
  fastify.post('/templates/:id/duplicate', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      },
      response: {
        201: EvaluationTemplateResponseSchema
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };
    
    const sourceTemplate = await prisma.evaluationTemplate.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!sourceTemplate) {
      return reply.code(404).send({ error: 'Template not found' });
    }

    // 仮の評価者IDを使用（実際は認証システムから取得）
    const evaluatorId = 'default-evaluator-id';

    const newTemplate = await prisma.evaluationTemplate.create({
      data: {
        name,
        description: sourceTemplate.description,
        position: sourceTemplate.position,
        skillWeight: sourceTemplate.skillWeight,
        willWeight: sourceTemplate.willWeight,
        mindWeight: sourceTemplate.mindWeight,
        isPublic: false, // 複製時は非公開にする
        createdById: evaluatorId,
        items: {
          create: sourceTemplate.items.map(item => ({
            category: item.category,
            name: item.name,
            description: item.description,
            weight: item.weight,
            required: item.required,
            order: item.order
          }))
        }
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        createdBy: true
      }
    });

    return reply.code(201).send(newTemplate);
  });
};

export default templatesRoute;