# Agri Chat

農業向け気象・圃場管理ダッシュボード。ポイント登録→14日間天気予報→ベストデイ分析→雨雲レーダーをひとつのアプリで提供する。

## Tech Stack

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| UI | React 19 / Inline styles |
| 認証・DB | Supabase (Auth + PostgreSQL + RLS) |
| 地図 | Mapbox GL JS |
| 天気 | Open-Meteo API |
| 雨雲レーダー | RainViewer API |
| 課金 | Stripe Checkout + Webhooks |
| AI | Anthropic Claude API |
| デプロイ | Vercel (予定) |

---

## ディレクトリ構成

```
src/
├── app/
│   ├── (app)/              # 認証必須ページ
│   │   ├── dashboard/      # メインダッシュボード
│   │   ├── settings/       # 設定・プラン確認
│   │   ├── support/        # お問い合わせフォーム
│   │   ├── chat/
│   │   └── documents/
│   ├── (auth)/             # 認証ページ（ログイン不要）
│   │   ├── login/
│   │   └── signup/
│   ├── (marketing)/        # LP・料金ページ
│   │   └── pricing/
│   └── api/
│       ├── checkout/       # Stripe Checkout セッション作成
│       ├── webhooks/stripe/ # Stripe Webhook受信
│       ├── weather/        # Open-Meteo プロキシ
│       ├── radar/tile/     # RainViewer タイルプロキシ（キャッシュ付き）
│       └── support/        # お問い合わせ保存
├── components/
│   ├── layout/
│   │   └── AccountMenu.tsx # ヘッダーアバターメニュー
│   └── dashboard/
│       ├── MapView.tsx           # Mapbox地図 + 雨雲レーダー
│       ├── WeatherDetailPanel.tsx # 時間別天気予報（tenki.jp風）
│       └── BestDayMatrix.tsx     # ベストデイ比較表
└── lib/
    ├── supabase/
    └── stripe/
```

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` をプロジェクトルートに作成して以下を記入：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_... (または sk_test_...)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase のセットアップ

Supabase ダッシュボード → **SQL Editor** で `supabase/schema.sql` の内容を実行する。

作成されるテーブル：

| テーブル | 用途 |
|---|---|
| `users` | プラン管理（free/pro）・Stripe顧客ID |
| `fields` | 圃場情報 |
| `field_records` | 作業記録 |
| `documents` | RAG用ドキュメント（pgvector） |
| `support_messages` | お問い合わせ |

> サインアップ時に `users` 行を自動作成するトリガー（`handle_new_user`）も schema.sql に含まれている。

### 4. 開発サーバーの起動

```bash
npm run dev
```

---

## Stripe のセットアップ

### ① Stripe アカウントと商品作成

1. [stripe.com](https://stripe.com) でアカウント作成
2. ダッシュボード左上の **「サンドボックス」** トグルをONにしてテストモードにする
3. **製品カタログ** → 「＋追加」 → 商品名・価格（月額サブスクリプション）を設定
4. 作成された **Price ID**（`price_xxx...`）を `.env.local` の `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` にセット
5. **APIキー** ページからシークレットキー（`sk_test_xxx`）を `.env.local` の `STRIPE_SECRET_KEY` にセット

### ② Webhook のローカル転送（開発時）

Stripe CLI をインストールして以下を実行：

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

出力される Signing Secret（`whsec_xxx...`）を `.env.local` の `STRIPE_WEBHOOK_SECRET` にセットして、開発サーバーを再起動する。

```
> Ready! You are using Stripe API Version [...]
> Your webhook signing secret is whsec_435801...  ← これをコピー
```

### ③ 本番 Webhook の設定

Stripe ダッシュボード → **Webhook** → エンドポイントを追加：

- URL: `https://yourdomain.com/api/webhooks/stripe`
- リッスンするイベント:
  - `checkout.session.completed`
  - `customer.subscription.deleted`

作成後に表示される Signing Secret を Vercel の環境変数 `STRIPE_WEBHOOK_SECRET` にセット。

### ④ 課金フロー概要

```
ユーザーが「Proにアップグレード」クリック
  → POST /api/checkout
  → Stripe Checkout セッション作成（metadata に user_id を付与）
  → Stripe の決済ページへリダイレクト
  → 決済完了
  → Stripe が POST /api/webhooks/stripe へ checkout.session.completed を送信
  → Supabase の users.plan を 'pro' に更新
  → success_url（/settings?upgraded=1）へリダイレクト
  → 設定画面でProバッジ表示
```

---

## 主要機能

### ダッシュボード

- **マップ**: Mapbox GL JS で圃場ポイントを表示・追加
- **雨雲レーダー**: RainViewer のアニメーションタイル（10分間隔で自動更新）
  - zoom12以上では過去タイルをオーバーズームして表示（zoom level not supported エラーなし）
  - タイルプロキシ側で5分間キャッシュ＋in-flight重複排除（429エラー対策）
- **天気予報パネル**: クリックしたポイントの時間別天気予報（tenki.jp風横スクロール表）
  - 時刻 / 天気アイコン / 気温（色分け） / 降水確率（背景強度）
  - 日付ヘッダーに今日・明日・日付と最高/最低気温を表示

### ベストデイマトリクス

- 登録ポイントの14日間天気スコアを一覧比較
- チェックボックスでポイントを選択（集計対象を絞り込み）
- 上位3日に金・銀・銅メダル表示
- デイスコア行がスティッキーで固定表示

### アカウント・課金

- ヘッダーのアバターボタンからドロップダウンメニュー
  - メールアドレス・プランバッジ（FREE/PRO）
  - Proアップグレードボタン（Freeユーザーのみ）
  - 設定・ログアウト
- 設定画面でプラン確認・アップグレード・ログアウト
- `/support` にアプリ内お問い合わせフォーム（Supabase に保存）

---

## Supabase スキーマ（主要テーブル）

```sql
-- プラン管理
create table public.users (
  id uuid primary key references auth.users(id),
  plan text default 'free' check (plan in ('free','pro')),
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- サインアップ時に自動作成
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- お問い合わせ
create table public.support_messages (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  email text,
  subject text not null,
  message text not null,
  status text default 'open',
  created_at timestamptz default now()
);
```

---

## 開発メモ

- Stripe Webhook のローカルテストは必ず `stripe listen` を使う。`.env.local` の `STRIPE_WEBHOOK_SECRET` は `stripe listen` 起動のたびに変わるので注意。
- Open-Meteo は無料・認証不要。レートリミットはないが大量リクエストは避ける。
- RainViewer は1時間あたりのリクエスト制限あり。`/api/radar/tile` プロキシでキャッシュ済み。
- Supabase RLS が有効なので、`users` テーブルの更新は Service Role Key を使う admin クライアント経由のみ可能（webhook側で使用）。
