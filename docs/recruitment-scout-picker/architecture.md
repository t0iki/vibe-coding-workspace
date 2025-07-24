# システム概念図

## システム全体構成

```mermaid
graph TB
    subgraph "採用媒体"
        A1[転職ドラフト<br/>PDF]
        A2[youtrust<br/>PDF]
        A3[その他媒体<br/>PDF]
    end

    subgraph "バックエンド (Fastify + TypeScript)"
        B1[PDFインポート機能<br/>pdf2json]
        B2[候補者データ管理<br/>PostgreSQL + Prisma]
        B3[ベクトル化エンジン]
        B4[マッチ率算出エンジン]
    end

    subgraph "データストア"
        D1[(PostgreSQL<br/>候補者データ)]
        D2[(Qdrant<br/>ベクトル検索)]
        D3[(Redis<br/>セッション/キャッシュ)]
    end

    subgraph "フロントエンド (Next.js + TypeScript)"
        F1[候補者一覧画面]
        F2[評価入力画面<br/>スキル/Will/マインド<br/>0-2評価]
        F3[類似候補者検索]
        F4[マッチ率表示]
    end

    A1 & A2 & A3 --> B1
    B1 --> B2
    B2 <--> D1
    B2 --> B3
    B3 <--> D2
    F1 & F2 & F3 & F4 <--> B2
    F2 --> D1
    B3 & D1 --> B4
    B4 --> F4
    F1 & F2 & F3 & F4 <--> D3
```

## データフロー詳細

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant B as バックエンド
    participant DB as PostgreSQL
    participant VDB as Qdrant
    participant R as Redis

    Note over U,R: PDF インポートフロー
    U->>F: PDFアップロード
    F->>B: PDF送信
    B->>B: pdf2jsonで解析
    B->>DB: 候補者データ保存
    B->>B: ベクトル化処理
    B->>VDB: ベクトル保存
    B->>F: 完了通知
    F->>U: インポート完了表示

    Note over U,R: 評価フロー
    U->>F: 候補者一覧表示
    F->>R: キャッシュ確認
    alt キャッシュあり
        R->>F: キャッシュデータ返却
    else キャッシュなし
        F->>B: 候補者リスト取得
        B->>DB: データ取得
        DB->>B: 候補者データ
        B->>F: 候補者リスト
        F->>R: キャッシュ保存
    end
    F->>U: 一覧表示
    U->>F: 評価入力(0-2)
    F->>B: 評価データ送信
    B->>DB: 評価保存

    Note over U,R: マッチ率算出フロー
    U->>F: 新規候補者入力
    F->>B: 候補者データ送信
    B->>B: ベクトル化
    B->>VDB: 類似検索
    VDB->>B: 類似候補者
    B->>DB: 過去評価取得
    DB->>B: 評価データ
    B->>B: マッチ率計算
    B->>F: マッチ率(0-100%)
    F->>U: 結果表示
```

## コンポーネント関係図

```mermaid
graph LR
    subgraph "Frontend Components"
        FC1[CandidateList<br/>候補者一覧]
        FC2[EvaluationForm<br/>評価フォーム]
        FC3[SimilarSearch<br/>類似検索]
        FC4[MatchScore<br/>マッチ率表示]
    end

    subgraph "Backend Services"
        BS1[PDFService<br/>PDF解析]
        BS2[CandidateService<br/>候補者管理]
        BS3[VectorService<br/>ベクトル処理]
        BS4[MatchingService<br/>マッチング]
    end

    subgraph "Shared Types"
        T1[Candidate<br/>候補者型]
        T2[Evaluation<br/>評価型]
        T3[Vector<br/>ベクトル型]
    end

    FC1 & FC2 & FC3 & FC4 --> T1 & T2
    BS1 & BS2 & BS3 & BS4 --> T1 & T2 & T3
```

## データフロー

1. **インポート**: PDF → 構造化データ → データベース保存
2. **評価**: 複数評価者 → 3値評価（スキル/Will/マインド） → 評価データ蓄積
3. **ベクトル化**: 候補者属性 → 数値ベクトル → ベクトル検索DB
4. **マッチング**: 新規候補者 → 類似検索 + 評価履歴分析 → マッチ率算出