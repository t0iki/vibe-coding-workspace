import { z } from 'zod';

export const evaluationSchema = z.object({
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  evaluatorId: z.string().uuid(),
  skillScore: z.number().int().min(0).max(2),
  willScore: z.number().int().min(0).max(2),
  mindScore: z.number().int().min(0).max(2),
  comment: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createEvaluationSchema = z.object({
  candidateId: z.string().uuid(),
  skillScore: z.number().int().min(0).max(2),
  willScore: z.number().int().min(0).max(2),
  mindScore: z.number().int().min(0).max(2),
  comment: z.string().optional()
});

export const updateEvaluationSchema = createEvaluationSchema.partial().omit({ candidateId: true });

export type Evaluation = z.infer<typeof evaluationSchema>;
export type CreateEvaluation = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluation = z.infer<typeof updateEvaluationSchema>;