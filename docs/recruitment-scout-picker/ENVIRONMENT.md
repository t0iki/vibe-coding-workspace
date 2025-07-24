# 候補者見極めくん - 環境変数設定ガイド

## 必要な環境変数

### バックエンド（/src/backend/.env）

```bash
# データベース設定
DATABASE_URL="postgresql://recruit_user:recruit_pass@localhost:5432/recruit_db"

# サーバー設定
PORT=3001
HOST=0.0.0.0

# Qdrant設定（ベクトルデータベース）
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=candidates

# 環境設定
NODE_ENV=development

# Gemini API（必須）
GEMINI_API_KEY=your-gemini-api-key
```

### フロントエンド（/src/frontend/.env.local）

```bash
# APIのベースURL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## セットアップ手順

### 1. Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/apikey) にアクセス
2. Googleアカウントでログイン
3. 「APIキーを作成」をクリック
4. 生成されたキーを `GEMINI_API_KEY` に設定

**Gemini 2.5 Flash Liteの特徴:**
- 最もコスト効率が高い（入力: $0.10/100万トークン、出力: $0.40/100万トークン）
- 高速レスポンス
- 100万トークンのコンテキストウィンドウ

### 2. PostgreSQLの設定

Docker Composeを使用する場合：
```bash
cd src
docker-compose up -d postgres
```

手動でインストールする場合：
- PostgreSQL 14以上をインストール
- データベースとユーザーを作成：
  ```sql
  CREATE USER recruit_user WITH PASSWORD 'recruit_pass';
  CREATE DATABASE recruit_db OWNER recruit_user;
  ```

### 3. Qdrantの設定

Docker Composeを使用する場合：
```bash
cd src
docker-compose up -d qdrant
```

手動でインストールする場合：
- [Qdrant](https://qdrant.tech/)をインストール
- デフォルトポート6333で起動

### 4. Redisの設定（オプション）

現在のバージョンでは使用していませんが、将来的なキャッシュ機能のために用意されています。

Docker Composeを使用する場合：
```bash
cd src
docker-compose up -d redis
```

## 環境変数ファイルの作成

### バックエンド

```bash
cd src/backend
cp .env.example .env
# .envファイルを編集してGEMINI_API_KEYを設定
```

### フロントエンド

```bash
cd src/frontend
cp .env.local.example .env.local
# 必要に応じてAPI URLを変更
```

## プロダクション環境の設定

### バックエンド

```bash
NODE_ENV=production
DATABASE_URL="postgresql://prod_user:prod_pass@prod-db-host:5432/prod_db"
GEMINI_API_KEY=your-production-gemini-api-key
```

### フロントエンド

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

## セキュリティに関する注意事項

1. **APIキーの管理**
   - Gemini APIキーは機密情報です
   - `.env`ファイルはGitにコミットしないでください
   - 本番環境では環境変数管理サービスの使用を推奨

2. **データベースの認証情報**
   - 本番環境では強力なパスワードを使用
   - 接続はSSL/TLSで暗号化することを推奨

3. **アクセス制限**
   - 本番環境ではファイアウォールでポートを制限
   - Qdrantへのアクセスは内部ネットワークのみに制限

## トラブルシューティング

### Gemini APIエラー

エラー: `Failed to create embedding`
- APIキーが正しく設定されているか確認
- APIの利用制限に達していないか確認
- [Google Cloud Status](https://status.cloud.google.com/)でサービス状態を確認
- Gemini 2.5 Flash Liteモデルが利用可能か確認

### データベース接続エラー

エラー: `Can't reach database server`
- PostgreSQLが起動しているか確認
- ポート番号が正しいか確認
- 認証情報が正しいか確認

### Qdrant接続エラー

エラー: `Failed to initialize Qdrant collection`
- Qdrantが起動しているか確認
- ポート6333が使用可能か確認
- コレクション名が正しいか確認