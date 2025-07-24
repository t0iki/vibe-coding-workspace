import axios from 'axios';

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class EmbeddingService {
  private apiKey: string;
  private model = 'text-embedding-ada-002';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post<EmbeddingResponse>(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: this.model
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw new Error('Failed to create embedding');
    }
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await axios.post<EmbeddingResponse>(
        'https://api.openai.com/v1/embeddings',
        {
          input: texts,
          model: this.model
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data
        .sort((a, b) => a.index - b.index)
        .map(item => item.embedding);
    } catch (error) {
      console.error('Error creating embeddings:', error);
      throw new Error('Failed to create embeddings');
    }
  }

  // 候補者情報をベクトル化用のテキストに変換
  formatCandidateText(candidate: {
    name: string;
    currentRole?: string;
    skills: string[];
    yearsOfExp?: number;
    will?: string;
  }): string {
    const parts = [
      `名前: ${candidate.name}`,
      candidate.currentRole ? `現在の役職: ${candidate.currentRole}` : '',
      candidate.yearsOfExp ? `経験年数: ${candidate.yearsOfExp}年` : '',
      `スキル: ${candidate.skills.join(', ')}`,
      candidate.will ? `やりたいこと: ${candidate.will}` : ''
    ];

    return parts.filter(part => part).join('\n');
  }

  // コサイン類似度を計算
  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}