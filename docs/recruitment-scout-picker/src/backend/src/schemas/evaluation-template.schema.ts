import { Type } from '@sinclair/typebox';

export const EvaluationTemplateItemSchema = Type.Object({
  id: Type.Optional(Type.String()),
  category: Type.Union([Type.Literal('skill'), Type.Literal('will'), Type.Literal('mind')]),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  weight: Type.Number({ default: 1.0 }),
  required: Type.Boolean({ default: false }),
  order: Type.Number()
});

export const CreateEvaluationTemplateSchema = Type.Object({
  name: Type.String(),
  description: Type.Optional(Type.String()),
  position: Type.String(),
  skillWeight: Type.Number({ default: 1.0 }),
  willWeight: Type.Number({ default: 1.0 }),
  mindWeight: Type.Number({ default: 1.0 }),
  isPublic: Type.Boolean({ default: false }),
  items: Type.Array(EvaluationTemplateItemSchema)
});

export const UpdateEvaluationTemplateSchema = Type.Object({
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  position: Type.Optional(Type.String()),
  skillWeight: Type.Optional(Type.Number()),
  willWeight: Type.Optional(Type.Number()),
  mindWeight: Type.Optional(Type.Number()),
  isPublic: Type.Optional(Type.Boolean()),
  items: Type.Optional(Type.Array(EvaluationTemplateItemSchema))
});

export const EvaluationTemplateResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  position: Type.String(),
  skillWeight: Type.Number(),
  willWeight: Type.Number(),
  mindWeight: Type.Number(),
  isPublic: Type.Boolean(),
  items: Type.Array(Type.Object({
    id: Type.String(),
    category: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    weight: Type.Number(),
    required: Type.Boolean(),
    order: Type.Number()
  })),
  createdById: Type.String(),
  createdBy: Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.String()
  }),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export type CreateEvaluationTemplateDto = typeof CreateEvaluationTemplateSchema.static;
export type UpdateEvaluationTemplateDto = typeof UpdateEvaluationTemplateSchema.static;
export type EvaluationTemplateResponse = typeof EvaluationTemplateResponseSchema.static;