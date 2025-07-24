export interface Evaluation {
  id: string;
  candidateId: string;
  evaluatorId: string;
  skillScore: 0 | 1 | 2; // 0: パス, 1: 迷う, 2: よい
  willScore: 0 | 1 | 2;
  mindScore: 0 | 1 | 2;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  evaluator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateEvaluation {
  candidateId: string;
  skillScore: 0 | 1 | 2;
  willScore: 0 | 1 | 2;
  mindScore: 0 | 1 | 2;
  comment?: string;
}