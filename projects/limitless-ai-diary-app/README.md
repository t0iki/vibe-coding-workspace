# Limitless AI 日記アプリプロジェクト

Limitless AIのAPIを活用して、自動的に日記を生成するアプリケーションの開発プロジェクトです。

## プロジェクト概要

Limitless AI Pendant（ペンダント型デバイス）が記録した日常の会話や活動（ライフログ）を元に、自動的に日記を生成し、管理できるアプリケーションを開発します。

## ドキュメント

- [Limitless AI API 概要](./limitless-api-overview.md) - APIの基本情報と日記アプリへの活用方法
- [API リファレンス](./api-reference.md) - 詳細なエンドポイント仕様
- [使用例](./usage-examples.md) - 実装サンプルコード

## 主な機能（予定）

- 📝 **自動日記生成** - ライフログから一日の出来事を自動的に日記形式に変換
- 🔍 **スマート検索** - 自然言語で過去の記録を検索
- 📊 **感情分析** - 日々の感情の変化を可視化
- 🏷️ **自動タグ付け** - AIが内容を分析して関連タグを自動生成
- 📤 **エクスポート機能** - PDFやMarkdown形式での出力

## 技術スタック（検討中）

- Frontend: React / Next.js
- Backend: Node.js / TypeScript
- Database: PostgreSQL / Supabase
- API: Limitless AI API
- Styling: Tailwind CSS

## セットアップ手順

1. Limitless AI APIキーの取得
   - [開発者ポータル](https://www.limitless.ai/developers)でアカウント作成
   - APIキーを取得

2. 環境変数の設定
   ```bash
   cp .env.example .env
   # .envファイルにAPIキーを設定
   ```

3. 依存関係のインストール
   ```bash
   npm install
   ```

4. 開発サーバーの起動
   ```bash
   npm run dev
   ```

## API制限事項

- 現在ベータ版のため、Pendantデータのみアクセス可能
- レート制限: 1分間に180リクエストまで
- Pendant所有者のみAPIを利用可能

## 今後の開発計画

1. **Phase 1**: 基本機能の実装
   - APIクライアントの実装
   - 日記生成機能
   - 基本的なUI

2. **Phase 2**: 高度な機能
   - 感情分析とビジュアライゼーション
   - 検索機能の強化
   - タグ管理システム

3. **Phase 3**: ユーザビリティ向上
   - モバイル対応
   - オフライン機能
   - 共有機能

## リソース

- [Limitless AI 公式サイト](https://www.limitless.ai/)
- [API ドキュメント](https://www.limitless.ai/developers)
- [コミュニティプロジェクト](https://github.com/panguin6010/awesome-limitless)

## ライセンス

TBD