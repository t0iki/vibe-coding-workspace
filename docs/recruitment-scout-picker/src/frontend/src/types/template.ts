export interface EvaluationTemplateItem {
  id?: string;
  category: 'skill' | 'will' | 'mind';
  name: string;
  description?: string;
  weight: number;
  required: boolean;
  order: number;
}

export interface EvaluationTemplate {
  id: string;
  name: string;
  description?: string;
  position: string;
  skillWeight: number;
  willWeight: number;
  mindWeight: number;
  isPublic: boolean;
  items: EvaluationTemplateItem[];
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationTemplate {
  name: string;
  description?: string;
  position: string;
  skillWeight: number;
  willWeight: number;
  mindWeight: number;
  isPublic: boolean;
  items: EvaluationTemplateItem[];
}

export interface UpdateEvaluationTemplate {
  name?: string;
  description?: string;
  position?: string;
  skillWeight?: number;
  willWeight?: number;
  mindWeight?: number;
  isPublic?: boolean;
  items?: EvaluationTemplateItem[];
}