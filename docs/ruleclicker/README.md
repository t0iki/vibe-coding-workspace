# RUNECLICKER Seed Kit v0.3 — 実装用コンセプト & 手順

**方針はシンプル**：実用重視。PoE的な“ビルド幅”を持ったクリッカーを、**遊ぶほどQoLが上がる**設計で100h以上遊べる形にする。法務は独自名称で回避（Keystone→**コーナーストーン**、Ascendancy→**分岐職**、Skill/Support Gem→**ルーン/リンク**）。

---

## 0. ゲームの核（1ページで把握）
- **一行**：**クリックで始まり、育つほど自動化・視認性・操作負担が軽くなる**。終盤は“押すより組むが楽しい”。
- **ループ**：短周回（3–6分） → 報酬 → **恒久QoL**＋**ビルド強化** → 次周回。
- **エンド**：裂け目マップ（T1–T20）× **アトラス盤**で自分のドロップ経済を作る。
- **非妥協**：QoLは戻さない／死にビルドを作らない／ブラウザで軽い（60fps）／100h+の厚み。

---

## 1. 実装順序（迷わないためのロードマップ）

### Phase 0：環境/骨組み（1–2日）
- TypeScript + Vite、UIは **Svelte** か **React**（好みで）。
- PixiJS（WebGL自動）導入。ゲームループは **描画(vsync)** と **演算(Worker, 固定Δt=50ms)** を分離。
- `/packages` モノレポ構成を作る（後述）。ESLint/Prettier/tsconfig、`zod`でJSONバリデーション。

### Phase 1：**戦闘コア（最小）**（2–3日）
- クリック/長押し→ **源流ダメージ** を発生。
- アクティブルーン2種＋サポート2種（連鎖/範囲）を**固定3リンク**で適用。DPSは**数式で集計**表示。
- 敵は**パック単位**でまとめ計算。雑魚TTK 1–3秒基準。

### Phase 2：**データ駆動**（1–2日）
- `/content/*.json` を読み込み、`zod`で検証。ルーン/リンク/盤/Mod/Atlas/QoLを**データ主導**に切替。
- `runes_active.json` / `runes_support.json` / `passives_core.json` の適用を確認。

### Phase 3：**パッシブ盤100ノード**（2–3日）
- `passives_core.json` の `pos:{x,y}` で盤を描画（ズーム/パン）。
- 取得・リスペック（Lv40まで無料）。**コーナーストーン**取得時は警告ダイアログ＋推奨リンク例を提示。

### Phase 4：**マップ周回（T1–T5）**（3–4日）
- `mapmods.json` を用いた入場前Mod選択（報酬倍率↑・危険↑）。
- 周回時間3–6分、ボスは短いDPS/EHPチェック。周回結果で通貨/欠片/ルーン/装備を排出。

### Phase 5：**QoL梯子（0–5h分）**（1–2日）
- 長押し、**自動拾い**、**自動分解**、**フィルタV1**、**オートクリック1.5cps**、**プリセット×2**。
- 以降のQoLは `qol_unlocks.json` に沿って段階解放。**戻さない**。

### Phase 6：**保存/復帰**（1日）
- IndexedDBに**圧縮JSON**で1分スナップショット。ロールフォワード復帰。バージョン付きマイグレーション。

### Phase 7：**Atlas枝×2**（2日）
- `atlas_nodes.json` の2枝（召喚/クラフト）。投資で**ドロップ偏重**を体感できるように。

### Phase 8：**クラフトと天井**（2–3日）
- `craft_tiers.json` のAffix/重み/天井（pity）/コスト適用。分解50%返金。リンク+1は段階成功or確定。

### Phase 9：**チューニング**（継続）
- `test_golden_values.csv` のDPS/EHPで回帰テスト。放置8hソーク。fps>50を維持。

> **受け入れ基準（Vertical Slice）**：T3を5–8分で安定周回／60fps維持（最低50）／セーブ破損なし。

---

## 2. ディレクトリ/ドメイン設計（モノレポ）

```
/packages
  /core            # 型・乱数・数式・時間管理
  /content         # JSON/YAMLとzodスキーマ、ローダ
  /sim             # 戦闘シム(Worker) 固定Δt=50ms
  /loot            # ドロップ/マップ/周回結果集計(Worker)
  /model           # ルーン/リンク/装備/盤のモデルとサービス
  /craft           # クラフト/天井/再鍛造
  /atlas           # アトラス盤の効果解決
  /qol             # QoL解放フラグ、プリセット保存/適用
  /persistence     # IndexedDB保存/圧縮/マイグレーション
  /ui              # Svelte/React + PixiJS（描画・入力）
  /devtools        # DPSメータ/ドロップログ/盤エディタ
  /telemetry       # KPIイベント（オプトアウト可）
```

**Workerプロトコル（最低限）**
```ts
// to sim worker
type SimStart = { type:'SIM_START'; seed:RNG; build:SerializedBuild; map:SerializedMap; sampleMs:number };
type SimStop  = { type:'SIM_STOP' };

// from sim worker
type SimReport = { type:'SIM_REPORT'; dps:number; ehp:number; breakdown:Record<string,number>; dotRatio:number };
type LootDrop  = { type:'LOOT'; items:Item[]; essences:number; shards:number };
type PerfStat  = { type:'PERF'; frameMs:number; entities:number };
```

---

## 3. 数式（確定版）
```
DPS = Base
    × (1 + Σ Increases[同系統])             // 系統内は加算
    × Π (1 + More_eff_i[異系統])            // 異系統は乗算
    × (1 + CritFactor)                      // Chance × (Multi-1)
    × (1 - ResistEff)                       // (Resist - Pen) の効き
More_eff = 1 - (1 - More)^0.7               // 正のmoreにディミニッシング
```
TTK基準：白1–3秒、精鋭10–20秒、ボス60–120秒（T1）。

---

## 4. 各データファイルの説明（このSeedに同梱）

### 4.1 `runes_active.json`
- **目的**：アクティブルーン（スキル本体）。
- **主キー**：`id`
- **必須**：
  - `base.hit` / `base.dps` / `base.elem`（`phys|fire|cold|light|chaos`）
  - `castMs`、`proj`（任意）
  - `tags`（`Projectile|Spell|Trap|Totem|Summon|Aura|Melee|DoT|Channel` 等）
  - `scales`（どのパラメータで伸びるか）
- **利用**：`sim`で基礎DPSに適用、`ui`でタグフィルタ。

### 4.2 `runes_support.json`
- **目的**：リンク（サポート）。挙動の改造。
- **`effect`**：
  - `more.{hit|dot|area|duration}` … 乗算（ただし `More_eff` を適用）
  - `add.repeat` / `chains` / `pierce` / `convert.to_fire=1.0` などの付与
- **将来**：`linkCost`で**リンク予算制**に移行可能。

### 4.3 `passives_core.json`
- **目的**：共通パッシブ盤（100ノードの雛形）。
- **項目**：`kind: small|notable|cornerstone`、`grants` or `desc`、`cost`、`pos:{x,y}`、`requires:[前ノード]`。
- **開始点**：`start_str|start_dex|start_int`（cost=0）。
- **CS例**：`cs_overclock / cs_converter / cs_autodrive / cs_muster`。

### 4.4 `branch_classes.json`
- **目的**：分岐職（Ascendancy相当）。本Seedは **2系×各1分岐**。
- **構造**：軽い小ノード→注目→最後に**コーナーストーン**（クラスの方向性を確定）。

### 4.5 `mapmods.json`
- **目的**：マップ入場時のMod（危険と報酬）。
- **項目**：`danger`（重み）/ `reward`（倍率の加点）/ `flags`（反射・耐性など）。

### 4.6 `atlas_nodes.json`
- **目的**：アトラス盤（メタの長期投資）。2枝×各20ノード。
- **効果例**：召喚系の出現重み、素材/地図ドロップ倍率、エリート密度。

### 4.7 `craft_tiers.json`
- **目的**：装備Affixプールと**天井（pity）**およびクラフトコスト。
- **`affix_pools`**：部位別に prefix/suffix のtier表とweight。
- **`pity_rules`**：リンクUP/ソケット開放の保証カウンタ。
- **`craft_costs`**：各操作に必要な通貨。

### 4.8 `qol_unlocks.json`
- **目的**：QoL解放の**段階**と**条件**と**付与フラグ**。
- **条件**：`playtime_h` / `shards` 等。**戻さない**のが前提。

### 4.9 `drop_table.csv`
- **目的**：重み・ILv帯・数量のテーブル。カテゴリ/レア度/タグ付き。

### 4.10 `test_golden_values.csv`
- **目的**：回帰テストのゴールデン値（DPS/EHP）。CIで比較して**数式の劣化検知**。

---

## 5. UI/UXの最低ライン（Vertical Slice）
- 長押し・**自動拾い**・**自動分解**・**フィルタV1**・**オートクリック1.5cps**。
- **装備/ルーン/盤のプリセット×2**。ワンクリ適用。
- **DPS/被ダメ内訳ログ**（`devtools`）で調整効率を上げる。

---

## 6. 性能と放置
- **固定Δt=50ms**、描画はvsync。弾幕は**集約描画**（実弾は出しすぎない）。
- 敵は**パック**でまとめ計算。ログはリングバッファ。
- **オフライン進行**は**決定論的集計**（逐次tick再生はしない）。

---

## 7. KPIと安全装置
- KPI：周回成功率／難度選択比／リスペック頻度／CS取得後の死亡率／**試行の増加**。
- 安全装置：Lv40まで無料リスペック／足切りUI（DPS/EHP不足を可視化）／クラフト50%返金＋天井。

---

## 8. 命名・法務
- PoE固有名・アイコン・文言は使用しない。**意匠は参照、名称は独自**。
- 本書の用語で統一（コーナーストーン／分岐職／ルーン/リンク）。

---

## 9. すぐ使える型（抜粋）
```ts
type Elem = 'phys'|'fire'|'cold'|'light'|'chaos';
type Tag  = 'Projectile'|'Spell'|'Trap'|'Totem'|'Summon'|'Aura'|'Melee'|'DoT'|'Channel';

interface RuneActive { id:string; name:string; base:{hit:number; dps:number; elem:Elem; castMs:number; proj?:number}; tags:Tag[]; scales:string[]; levelReq:number }
interface RuneSupport{ id:string; name:string; effect:any; linkCost?:number; allowTags?:Tag[]; forbidTags?:Tag[] }
interface PassiveNode{ id:string; kind:'small'|'notable'|'cornerstone'; grants?:Record<string,number>; desc?:string; cost:number; pos?:{x:number,y:number}; requires?:string[] }
```

---

## 10. ビルドのサンプル（プロト検証用）
1. **連鎖ライトニング**：`r_chain_bolt + s_chain + s_aoe`  
2. **骨軍勢**：`r_summon_skel + s_minion_swarm + s_duration`  
3. **設置連射**：`r_trap + s_multi + s_pierce`

---

## 11. 受け入れテスト項目（抜粋）
- **数式回帰**：`test_golden_values.csv` のDPS/EHPと一致±1%。
- **放置8h**：メモリリーク無し、セーブ/復帰OK。
- **最悪負荷**：密度最大・弾幕最大でも50fps未満に落ちない。
- **セーブ互換**：`saveVersion` 付きでマイグレーション通過。

---

## 12. まとめ（開発の芯）
- 序盤は**手で押して速い**、中盤から**自動が最適**に反転。
- **“成立する自由”**を守る：足切り提示・無料リスペック・天井クラフト。
- エンドは**自分の経済を作る**（アトラス）。QoLは常に右肩上がり。戻さない。

> 以上。実装を進めてください。課題が出たらデータから調整するのが最優先です。
