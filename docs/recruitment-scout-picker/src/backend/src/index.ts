import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { QdrantService } from './services/qdrant.service';

dotenv.config();

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'development' 
      ? { target: 'pino-pretty' }
      : undefined
  }
});

async function start() {
  try {
    await server.register(helmet);
    await server.register(cors, {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : true
    });
    
    await server.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10 // 最大10ファイルまで
      }
    });
    
    await server.register(swagger, {
      swagger: {
        info: {
          title: '候補者見極めくん API',
          description: '候補者の評価とマッチング率算出ツールAPI',
          version: '0.1.0'
        },
        externalDocs: {
          url: 'https://swagger.io',
          description: 'Find more info here'
        },
        host: 'localhost:3001',
        schemes: ['http'],
        consumes: ['application/json', 'multipart/form-data'],
        produces: ['application/json'],
        tags: [
          { name: 'candidates', description: '候補者関連のエンドポイント' },
          { name: 'evaluations', description: '評価関連のエンドポイント' },
          { name: 'upload', description: 'PDFアップロード関連のエンドポイント' },
          { name: 'templates', description: '評価テンプレート関連のエンドポイント' }
        ]
      }
    });
    
    await server.register(swaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, request, reply) => {
        return swaggerObject;
      },
      transformSpecificationClone: true
    });
    
    server.get('/', async (request, reply) => {
      return { status: 'ok', message: '候補者見極めくん API' };
    });
    
    server.get('/health', async (request, reply) => {
      return { 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
    });
    
    // Routes
    await server.register(import('./routes/candidates.route'), { prefix: '/api/candidates' });
    await server.register(import('./routes/upload.route'), { prefix: '/api/upload' });
    await server.register(import('./routes/evaluations.route'), { prefix: '/api/evaluations' });
    await server.register(import('./routes/search.route'), { prefix: '/api/search' });
    await server.register(import('./routes/matching.route'), { prefix: '/api/matching' });
    await server.register(import('./routes/templates.route'), { prefix: '/api' });
    
    // Qdrantコレクションの初期化
    const qdrantService = new QdrantService(
      process.env.QDRANT_URL || 'http://localhost:6333',
      process.env.QDRANT_COLLECTION || 'candidates'
    );
    
    try {
      // OpenAI ada-002のベクトルサイズは1536
      await qdrantService.createCollection(1536);
      server.log.info('Qdrant collection initialized');
    } catch (error) {
      server.log.error('Failed to initialize Qdrant collection:', error);
    }
    
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    server.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();