# Limitless AI API 調査まとめ

## 概要

Limitless AIは、日常の会話や活動を記録し、パーソナライズされたAI体験を提供するプラットフォームです。現在、開発者向けAPIはベータ版として提供されています。

### 主な特徴
- **Pendant（ペンダント）**: 軽量ウェアラブルデバイスで、一日中あなたの発言を記録
- **Lifelog（ライフログ）**: Pendantが記録した会話や活動の記録
- **API**: Pendantのデータにアクセスし、外部アプリケーションと統合可能

## API仕様

### 認証
- APIキーベースの認証（`X-API-Key`ヘッダー）
- APIキーは[開発者設定](https://www.limitless.ai/developers)から取得可能
- **重要**: APIキーは絶対に公開してはいけません

### レート制限
- 1分間に180リクエストまで
- 制限を超えると429ステータスコードが返される

### ベースURL
```
https://api.limitless.ai
```

## エンドポイント

### 1. ライフログ一覧の取得
```
GET /v1/lifelogs
```

**パラメータ:**
- `date`: 日付（YYYY-MM-DD形式）
- `timezone`: タイムゾーン
- `start_time`: 開始時刻
- `end_time`: 終了時刻
- `search`: 自然言語での検索クエリ
- `page`: ページ番号
- `limit`: 1ページあたりの件数

**レスポンス例:**
```json
{
  "lifelogs": [
    {
      "id": "lifelog_123",
      "date": "2024-01-15",
      "start_time": "09:00:00",
      "end_time": "09:30:00",
      "summary": "チームミーティングについて話し合った",
      "transcript": "..."
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100
  }
}
```

### 2. 特定のライフログの取得
```
GET /v1/lifelogs/:id
```

**パラメータ:**
- `include_markdown`: マークダウン形式で返すか（オプション）
- `include_headings`: 見出しを含めるか（オプション）

### 3. ライフログの削除
```
DELETE /v1/lifelogs/:id
```

完全に削除され、復元不可能

## 使用例

### cURL
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://api.limitless.ai/v1/lifelogs?date=2024-01-15
```

### TypeScript
```typescript
const response = await fetch('https://api.limitless.ai/v1/lifelogs', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY'
  }
});
const data = await response.json();
```

### Python
```python
import requests

response = requests.get(
    'https://api.limitless.ai/v1/lifelogs',
    headers={'X-API-Key': 'YOUR_API_KEY'}
)
data = response.json()
```

## 日記アプリへの活用方法

### 想定される機能
1. **自動日記生成**: ライフログから一日の出来事を自動的に日記形式に変換
2. **検索機能**: 過去の会話や活動を自然言語で検索
3. **タイムライン表示**: 時系列でライフログを表示
4. **感情分析**: 会話内容から感情を分析し、日記に反映
5. **要約機能**: 長い会話を簡潔にまとめて日記に記録

### 技術的な考慮事項
- APIの制限（Pendantデータのみ）を考慮した設計
- レート制限に対応したリクエスト管理
- プライバシーとセキュリティの確保
- オフライン対応（キャッシュ機能）

## 参考リソース
- [公式開発者ドキュメント](https://www.limitless.ai/developers)
- [APIサンプルコード](https://github.com/limitless-ai-inc/limitless-api-examples)
- [awesome-limitless](https://github.com/panguin6010/awesome-limitless) - コミュニティプロジェクト集
- [Limitlessヘルプセンター](https://help.limitless.ai/en/articles/11106060-limitless-api)

## 制限事項
- 現在ベータ版のため、Pendantデータのみアクセス可能
- Web/デスクトップミーティングのデータは未対応
- Pendant所有者のみAPIを利用可能

## サポート
- Slackコミュニティの#developersチャンネルで技術サポートを受けられます