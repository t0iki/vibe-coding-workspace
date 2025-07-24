# 採用スカウトピック効率化ツール

## 概要
転職ドラフトやyoutrustから候補者情報（PDF）を取り込み、複数評価者が協働でスキル/Will/マインドを3段階評価し、過去の評価データを基に新規候補者のマッチ率を自動算出するツール。

## 技術スタック
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL + Prisma
- **Vector Search**: Qdrant
- **PDF Processing**: pdf2json

## セットアップ

### 必要な環境
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### インストール
```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集

# データベースのセットアップ
docker-compose up -d
pnpm db:migrate
```

### 開発サーバーの起動
```bash
# フロントエンドとバックエンドを同時起動
pnpm dev

# 個別起動
pnpm --filter frontend dev
pnpm --filter backend dev
```

## プロジェクト構成
```
code/
├── frontend/       # Next.js フロントエンド
├── backend/        # Fastify バックエンド
├── shared/         # 共通型定義
└── docker/         # Docker設定
```