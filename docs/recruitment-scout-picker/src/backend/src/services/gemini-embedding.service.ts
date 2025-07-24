import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiEmbeddingService {
  private genAI: GoogleGenerativeAI;
  private model = 'gemini-2.5-flash-lite';
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Gemini 2.5 Flash Liteを使用してテキストから特徴ベクトルを生成
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      // Geminiに候補者の特徴を分析してもらい、ベクトル化用の特徴を抽出
      const prompt = `以下の候補者情報から、技術スキル、経験、意欲などの特徴を分析し、
      類似性判定に使える特徴を構造化して出力してください。
      
      候補者情報:
      ${text}
      
      以下の形式でJSON配列として出力してください（説明は不要）:
      [スキルレベル(0-10), 経験年数の重み(0-10), 技術の幅広さ(0-10), 成長意欲(0-10), チーム適性(0-10), ...]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // JSONから数値配列を抽出
      try {
        const features = JSON.parse(responseText.match(/\[[\d,.\s]+\]/)?.[0] || '[]');
        
        // 特徴ベクトルを正規化（0-1の範囲に）
        const normalizedFeatures = features.map((f: number) => f / 10);
        
        // 1536次元に拡張（Qdrantとの互換性のため）
        const embedding = new Array(1536).fill(0);
        normalizedFeatures.forEach((value: number, index: number) => {
          if (index < embedding.length) {
            embedding[index] = value;
          }
        });
        
        // ランダムノイズを追加して次元を埋める
        for (let i = normalizedFeatures.length; i < embedding.length; i++) {
          embedding[i] = Math.random() * 0.1; // 小さなランダム値
        }
        
        return embedding;
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', responseText);
        // フォールバック: ランダムベクトルを返す
        return new Array(1536).fill(0).map(() => Math.random());
      }
    } catch (error) {
      console.error('Error creating embedding with Gemini:', error);
      throw new Error('Failed to create embedding');
    }
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    // バッチ処理のため、並列で実行
    const embeddings = await Promise.all(
      texts.map(text => this.createEmbedding(text))
    );
    return embeddings;
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
      `技術スキル: ${candidate.skills.join(', ')}`,
      candidate.will ? `やりたいこと・意欲: ${candidate.will}` : ''
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

  // より高度な候補者分析（Gemini 2.5 Flash Liteの能力を活用）
  async analyzeCandidateWithGemini(candidateText: string): Promise<{
    summary: string;
    strengths: string[];
    matchingHints: string[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      const prompt = `以下の候補者情報を分析して、採用観点から重要なポイントをまとめてください。

      候補者情報:
      ${candidateText}

      以下の形式でJSON形式で出力してください：
      {
        "summary": "候補者の概要（1-2文）",
        "strengths": ["強み1", "強み2", ...],
        "matchingHints": ["どんな企業/チームに合うか1", "どんな企業/チームに合うか2", ...]
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      try {
        return JSON.parse(responseText.match(/\{[\s\S]*\}/)?.[0] || '{}');
      } catch {
        return {
          summary: '候補者情報の分析中',
          strengths: [],
          matchingHints: []
        };
      }
    } catch (error) {
      console.error('Error analyzing candidate:', error);
      return {
        summary: '分析エラー',
        strengths: [],
        matchingHints: []
      };
    }
  }
}