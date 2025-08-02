# Limitless AI API リファレンス

## 基本情報

### ベースURL
```
https://api.limitless.ai
```

### 認証
すべてのAPIリクエストには、`X-API-Key`ヘッダーにAPIキーを含める必要があります。

```
X-API-Key: your-api-key-here
```

### レスポンス形式
- すべてのレスポンスはJSON形式
- 成功時: HTTP 200 OK
- エラー時: 適切なHTTPステータスコードとエラーメッセージ

### エラーレスポンス
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Please try again later."
  }
}
```

## エンドポイント詳細

### 1. GET /v1/lifelogs - ライフログ一覧取得

ユーザーのライフログを取得します。日付、時間範囲、検索クエリでフィルタリング可能。

#### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|----|-----|
| date | string | No | 日付（YYYY-MM-DD形式） |
| timezone | string | No | タイムゾーン（例: "Asia/Tokyo"） |
| start_time | string | No | 開始時刻（HH:MM:SS形式） |
| end_time | string | No | 終了時刻（HH:MM:SS形式） |
| search | string | No | 自然言語検索クエリ |
| page | integer | No | ページ番号（デフォルト: 1） |
| limit | integer | No | 1ページあたりの件数（デフォルト: 20、最大: 100） |

#### レスポンス
```json
{
  "lifelogs": [
    {
      "id": "lifelog_abc123",
      "date": "2024-01-15",
      "start_time": "09:00:00",
      "end_time": "09:30:00",
      "duration_seconds": 1800,
      "summary": "プロジェクトの進捗について話し合った",
      "transcript": "今日はプロジェクトの進捗について...",
      "location": {
        "name": "オフィス",
        "latitude": 35.6762,
        "longitude": 139.6503
      },
      "participants": ["自分"],
      "tags": ["仕事", "ミーティング"],
      "created_at": "2024-01-15T09:30:00Z",
      "updated_at": "2024-01-15T09:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 20,
    "has_next": true,
    "has_previous": false
  }
}
```

### 2. GET /v1/lifelogs/:id - 特定のライフログ取得

特定のIDのライフログの詳細情報を取得します。

#### パスパラメータ
- `id`: ライフログID（必須）

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|----|-----|
| include_markdown | boolean | No | マークダウン形式で返すか（デフォルト: false） |
| include_headings | boolean | No | 見出しを含めるか（デフォルト: false） |

#### レスポンス
```json
{
  "id": "lifelog_abc123",
  "date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "09:30:00",
  "duration_seconds": 1800,
  "summary": "プロジェクトの進捗について話し合った",
  "transcript": "今日はプロジェクトの進捗について...",
  "transcript_markdown": "# ミーティング要約\n\n## 議題\n- プロジェクトの進捗確認...",
  "topics": [
    {
      "name": "プロジェクト進捗",
      "confidence": 0.95
    },
    {
      "name": "次週の計画",
      "confidence": 0.87
    }
  ],
  "sentiment": {
    "overall": "positive",
    "score": 0.75
  },
  "location": {
    "name": "オフィス",
    "latitude": 35.6762,
    "longitude": 139.6503
  },
  "audio_url": "https://storage.limitless.ai/audio/lifelog_abc123.mp3",
  "metadata": {
    "device_id": "pendant_xyz789",
    "firmware_version": "1.2.3",
    "battery_level": 85
  },
  "created_at": "2024-01-15T09:30:00Z",
  "updated_at": "2024-01-15T09:30:00Z"
}
```

### 3. DELETE /v1/lifelogs/:id - ライフログ削除

特定のライフログを完全に削除します。この操作は取り消せません。

#### パスパラメータ
- `id`: ライフログID（必須）

#### レスポンス
```json
{
  "success": true,
  "message": "Lifelog successfully deleted",
  "deleted_id": "lifelog_abc123"
}
```

## ステータスコード

| コード | 説明 |
|-------|-----|
| 200 | 成功 |
| 400 | 不正なリクエスト |
| 401 | 認証エラー |
| 403 | アクセス権限なし |
| 404 | リソースが見つからない |
| 429 | レート制限超過 |
| 500 | サーバーエラー |

## レート制限

- 1分間に180リクエストまで
- レート制限に達した場合、`Retry-After`ヘッダーに待機時間（秒）が返される

### レート制限レスポンスヘッダー
```
X-RateLimit-Limit: 180
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642339200
Retry-After: 60
```

## ベストプラクティス

1. **エラーハンドリング**: すべてのAPIレスポンスでエラーチェックを実装
2. **レート制限対応**: 429エラー時は`Retry-After`に従って再試行
3. **ページネーション**: 大量のデータを扱う際は必ずページネーションを使用
4. **キャッシング**: 頻繁にアクセスするデータはクライアント側でキャッシュ
5. **セキュリティ**: APIキーは環境変数に保存し、ソースコードに含めない

## 日記アプリでの活用例

### 今日の日記を自動生成
```typescript
async function generateTodaysDiary(apiKey: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const response = await fetch(
    `https://api.limitless.ai/v1/lifelogs?date=${today}`,
    {
      headers: { 'X-API-Key': apiKey }
    }
  );
  
  const data = await response.json();
  
  // ライフログから日記を生成
  const diaryEntry = data.lifelogs.map(log => ({
    time: log.start_time,
    summary: log.summary,
    mood: log.sentiment?.overall || 'neutral'
  }));
  
  return diaryEntry;
}
```