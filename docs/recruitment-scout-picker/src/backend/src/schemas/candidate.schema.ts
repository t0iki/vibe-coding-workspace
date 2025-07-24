import { z } from 'zod';

export const candidateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  age: z.number().int().nullable(),
  yearsOfExp: z.number().int().nullable(),
  currentRole: z.string().nullable(),
  skills: z.array(z.string()),
  will: z.string().nullable(),
  source: z.enum(['youtrust', 'draft']),
  sourceUrl: z.string().url().nullable(),
  pdfPath: z.string().nullable(),
  embedding: z.array(z.number()),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createCandidateSchema = z.object({
  name: z.string(),
  age: z.number().int().optional(),
  yearsOfExp: z.number().int().optional(),
  currentRole: z.string().optional(),
  skills: z.array(z.string()),
  will: z.string().optional(),
  source: z.enum(['youtrust', 'draft']),
  sourceUrl: z.string().url().optional()
});

export const updateCandidateSchema = createCandidateSchema.partial();

export const candidateQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  source: z.enum(['youtrust', 'draft']).optional(),
  search: z.string().optional()
});

export type Candidate = z.infer<typeof candidateSchema>;
export type CreateCandidate = z.infer<typeof createCandidateSchema>;
export type UpdateCandidate = z.infer<typeof updateCandidateSchema>;
export type CandidateQuery = z.infer<typeof candidateQuerySchema>;