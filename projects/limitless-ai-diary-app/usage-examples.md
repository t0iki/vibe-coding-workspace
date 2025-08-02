# Limitless AI × 日記アプリ 実装例

## 基本的な使用例

### 1. API初期化
```typescript
// api-client.ts
class LimitlessAPIClient {
  private apiKey: string;
  private baseURL = 'https://api.limitless.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getLifelogs(params?: {
    date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/v1/lifelogs?${queryParams}`);
  }

  async getLifelog(id: string) {
    return this.request(`/v1/lifelogs/${id}`);
  }

  async deleteLifelog(id: string) {
    return this.request(`/v1/lifelogs/${id}`, { method: 'DELETE' });
  }
}
```

### 2. 日記エントリー生成機能

```typescript
// diary-generator.ts
interface DiaryEntry {
  date: string;
  title: string;
  content: string;
  mood: string;
  highlights: string[];
  tags: string[];
}

class DiaryGenerator {
  constructor(private apiClient: LimitlessAPIClient) {}

  async generateDailyDiary(date: string): Promise<DiaryEntry> {
    // その日のライフログを取得
    const response = await this.apiClient.getLifelogs({ date });
    const lifelogs = response.lifelogs;

    if (lifelogs.length === 0) {
      throw new Error('この日のライフログが見つかりません');
    }

    // ライフログから日記を生成
    const highlights = this.extractHighlights(lifelogs);
    const overallMood = this.analyzeMood(lifelogs);
    const tags = this.extractTags(lifelogs);
    const content = this.generateNarrative(lifelogs);

    return {
      date,
      title: `${date}の記録`,
      content,
      mood: overallMood,
      highlights,
      tags,
    };
  }

  private extractHighlights(lifelogs: any[]): string[] {
    // 重要な出来事を抽出
    return lifelogs
      .filter(log => log.summary && log.summary.length > 50)
      .map(log => log.summary)
      .slice(0, 5);
  }

  private analyzeMood(lifelogs: any[]): string {
    // 感情分析の集計
    const moods = lifelogs
      .filter(log => log.sentiment?.overall)
      .map(log => log.sentiment.overall);

    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 最も多い感情を返す
    return Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
  }

  private extractTags(lifelogs: any[]): string[] {
    // すべてのタグを集計
    const allTags = lifelogs.flatMap(log => log.tags || []);
    return [...new Set(allTags)];
  }

  private generateNarrative(lifelogs: any[]): string {
    // 時系列で日記を生成
    const sortedLogs = lifelogs.sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );

    const narrative = sortedLogs.map(log => {
      const time = log.start_time.slice(0, 5); // HH:MM形式
      return `${time} - ${log.summary}`;
    }).join('\n\n');

    return narrative;
  }
}
```

### 3. 検索機能の実装

```typescript
// diary-search.ts
class DiarySearch {
  constructor(private apiClient: LimitlessAPIClient) {}

  async searchDiaries(query: string): Promise<any[]> {
    // 自然言語検索
    const response = await this.apiClient.getLifelogs({ search: query });
    return this.formatSearchResults(response.lifelogs);
  }

  async searchByDateRange(startDate: string, endDate: string): Promise<any[]> {
    const results = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 日付範囲で検索
    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      try {
        const response = await this.apiClient.getLifelogs({ date: dateStr });
        results.push(...response.lifelogs);
      } catch (error) {
        console.error(`Error fetching logs for ${dateStr}:`, error);
      }
    }

    return this.formatSearchResults(results);
  }

  private formatSearchResults(lifelogs: any[]): any[] {
    return lifelogs.map(log => ({
      id: log.id,
      date: log.date,
      time: log.start_time,
      summary: log.summary,
      preview: log.transcript?.substring(0, 200) + '...',
      tags: log.tags || [],
    }));
  }
}
```

### 4. React コンポーネント例

```tsx
// DiaryApp.tsx
import React, { useState, useEffect } from 'react';

const DiaryApp: React.FC = () => {
  const [diary, setDiary] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const apiClient = new LimitlessAPIClient(process.env.REACT_APP_LIMITLESS_API_KEY!);
  const diaryGenerator = new DiaryGenerator(apiClient);

  const loadDiary = async () => {
    setLoading(true);
    try {
      const entry = await diaryGenerator.generateDailyDiary(selectedDate);
      setDiary(entry);
    } catch (error) {
      console.error('日記の生成に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiary();
  }, [selectedDate]);

  return (
    <div className="diary-app">
      <header>
        <h1>Limitless AI 日記</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </header>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : diary ? (
        <article className="diary-entry">
          <h2>{diary.title}</h2>
          <div className="mood">今日の気分: {diary.mood}</div>
          
          <section className="highlights">
            <h3>今日のハイライト</h3>
            <ul>
              {diary.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </section>

          <section className="content">
            <h3>詳細</h3>
            <pre>{diary.content}</pre>
          </section>

          <section className="tags">
            {diary.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </section>
        </article>
      ) : (
        <div className="no-data">この日の記録はありません</div>
      )}
    </div>
  );
};
```

### 5. エラーハンドリングとリトライ機能

```typescript
// api-utils.ts
class APIUtils {
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (error.status === 429 && i < maxRetries - 1) {
          // レート制限の場合は待機
          const retryAfter = error.headers?.['retry-after'] || delay;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else if (i === maxRetries - 1) {
          throw error;
        } else {
          // その他のエラーの場合は指数バックオフ
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    throw new Error('Max retries exceeded');
  }
}

// 使用例
const getDiaryWithRetry = async (date: string) => {
  return APIUtils.withRetry(() => diaryGenerator.generateDailyDiary(date));
};
```

### 6. キャッシュ機能の実装

```typescript
// cache-manager.ts
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// キャッシュ付きAPIクライアント
class CachedLimitlessAPIClient extends LimitlessAPIClient {
  private cache = new CacheManager();

  async getLifelogs(params?: any) {
    const cacheKey = `lifelogs:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const data = await super.getLifelogs(params);
    this.cache.set(cacheKey, data);
    return data;
  }
}
```

## 日記アプリの機能アイデア

1. **自動要約**: 長い会話を要約して日記に記録
2. **感情トレンド**: 日々の感情の変化をグラフで可視化
3. **検索機能**: キーワードや日付、感情で過去の記録を検索
4. **タグ管理**: 自動的にタグを生成し、カテゴリー別に整理
5. **エクスポート**: 日記をPDFやMarkdown形式でエクスポート
6. **リマインダー**: 重要な出来事や約束を通知
7. **統計情報**: 月別・週別の活動サマリー
8. **プライバシー設定**: 特定のライフログを非公開に設定

## セキュリティのベストプラクティス

```typescript
// .env
REACT_APP_LIMITLESS_API_KEY=your-api-key-here

// config.ts
const config = {
  apiKey: process.env.REACT_APP_LIMITLESS_API_KEY,
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.limitless.ai',
};

if (!config.apiKey) {
  throw new Error('REACT_APP_LIMITLESS_API_KEY is required');
}

export default config;
```