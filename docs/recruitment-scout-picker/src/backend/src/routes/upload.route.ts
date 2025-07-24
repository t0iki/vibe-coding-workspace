import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PDFParseService } from '../services/pdf.service';
import { GeminiEmbeddingService } from '../services/gemini-embedding.service';
import { QdrantService } from '../services/qdrant.service';
import path from 'path';

const prisma = new PrismaClient();
const pdfService = new PDFParseService();
const embeddingService = new GeminiEmbeddingService(process.env.GEMINI_API_KEY || '');
const qdrantService = new QdrantService(
  process.env.QDRANT_URL || 'http://localhost:6333',
  process.env.QDRANT_COLLECTION || 'candidates'
);

const uploadRoute: FastifyPluginAsync = async (server) => {
  // PDFアップロードエンドポイント
  server.post('/', {
    schema: {
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            candidate: { type: 'object' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      },
      tags: ['upload']
    }
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({ error: 'ファイルがアップロードされていません' });
      }

      // PDFファイルかチェック
      if (!data.filename.toLowerCase().endsWith('.pdf')) {
        return reply.code(400).send({ error: 'PDFファイルのみアップロード可能です' });
      }

      // ファイルを保存
      const uploadDir = path.join(process.cwd(), 'uploads');
      const filepath = await pdfService.saveUploadedFile(data, uploadDir);

      // PDFを解析
      const parsedData = await pdfService.parsePDF(filepath);

      // ベクトル化
      const candidateText = embeddingService.formatCandidateText(parsedData);
      const embedding = await embeddingService.createEmbedding(candidateText);

      // データベースに保存
      const candidate = await prisma.candidate.create({
        data: {
          name: parsedData.name,
          skills: parsedData.skills,
          currentRole: parsedData.currentRole,
          yearsOfExp: parsedData.yearsOfExp,
          will: parsedData.will,
          source: parsedData.source,
          pdfPath: filepath,
          embedding: embedding
        }
      });

      // Qdrantに保存
      await qdrantService.upsertPoint({
        id: candidate.id,
        vector: embedding,
        payload: {
          name: candidate.name,
          skills: candidate.skills,
          currentRole: candidate.currentRole,
          source: candidate.source
        }
      });

      return {
        success: true,
        candidate,
        message: 'PDFファイルが正常にアップロードされ、候補者情報が登録されました'
      };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ 
        error: 'PDFの処理中にエラーが発生しました' 
      });
    }
  });

  // 一括アップロードエンドポイント
  server.post('/bulk', {
    schema: {
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            processed: { type: 'number' },
            failed: { type: 'number' },
            candidates: { type: 'array' },
            errors: { type: 'array' }
          }
        }
      },
      tags: ['upload']
    }
  }, async (request, reply) => {
    const candidates = [];
    const errors = [];
    let processed = 0;
    let failed = 0;

    try {
      const parts = request.parts();
      
      for await (const part of parts) {
        if (part.type === 'file') {
          try {
            // PDFファイルかチェック
            if (!part.filename.toLowerCase().endsWith('.pdf')) {
              errors.push(`${part.filename}: PDFファイルではありません`);
              failed++;
              continue;
            }

            // ファイルを保存
            const uploadDir = path.join(process.cwd(), 'uploads');
            const filepath = await pdfService.saveUploadedFile(part, uploadDir);

            // PDFを解析
            const parsedData = await pdfService.parsePDF(filepath);

            // ベクトル化
            const candidateText = embeddingService.formatCandidateText(parsedData);
            const embedding = await embeddingService.createEmbedding(candidateText);

            // データベースに保存
            const candidate = await prisma.candidate.create({
              data: {
                name: parsedData.name,
                skills: parsedData.skills,
                currentRole: parsedData.currentRole,
                yearsOfExp: parsedData.yearsOfExp,
                will: parsedData.will,
                source: parsedData.source,
                pdfPath: filepath,
                embedding: embedding
              }
            });

            // Qdrantに保存
            await qdrantService.upsertPoint({
              id: candidate.id,
              vector: embedding,
              payload: {
                name: candidate.name,
                skills: candidate.skills,
                currentRole: candidate.currentRole,
                source: candidate.source
              }
            });

            candidates.push(candidate);
            processed++;
          } catch (error) {
            errors.push(`${part.filename}: 処理エラー`);
            failed++;
            server.log.error(error);
          }
        }
      }

      return {
        success: true,
        processed,
        failed,
        candidates,
        errors
      };
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({ 
        error: '一括アップロード中にエラーが発生しました' 
      });
    }
  });
};

export default uploadRoute;