# 競馬ランダム抽選Webアプリ リニューアル仕様書

バージョン: 0.5（厳重レビュー反映版）  
更新日: 2026-06-07  
現行アプリ: `https://umano-ie.com/tool01/`  
新版の正規URL: `https://umano-ie.com/race-game/`

## 目的

既存の番号抽選Webアプリを、スマートフォンで遊びやすいレトロゲーム風の競馬番号シミュレーターへリニューアルするためのAI開発用資料です。

実在する競走馬名、実際のレースデータ、公式ロゴ、オッズ、投票機能、馬券購入機能は扱いません。競走馬は番号のみで識別します。

## 採用する運用構成

新版はWordPressテーマ、プラグイン、`functions.php`へ組み込まず、Xサーバーの対象ドメイン配下にある`public_html/race-game/`へ独立した静的Webアプリとして配置します。

```text
対象ドメイン/public_html/
├── WordPress本体                  # 既存ブログ。原則変更しない
├── .htaccess                      # 原則変更しない。公開前に影響確認
└── race-game/
    ├── index.html                 # 新版アプリの入口
    ├── assets/
    └── config/
```

## 重要な実装ルール

- 正規URLは末尾スラッシュ付きの`/race-game/`とする。
- WordPressの`functions.php`は原則変更しない。
- カンパサービスは固定せず、外部URLと表示設定を設定ファイルで切り替える。
- AdSenseはゲームロジックへ埋め込まず、後から設定できる専用連携層へ分離する。
- GA4はWordPress側の設定が静的アプリへ自動継承されると仮定しない。
- AI開発用資料、原本、バックアップは`public_html`へアップロードしない。

## ドキュメント一覧

| ファイル | 用途 |
|---|---|
| `docs/00_PROJECT_OVERVIEW.md` | 背景、目的、確定事項、暫定決定、対象外 |
| `docs/01_REQUIREMENTS.md` | 機能要件・非機能要件 |
| `docs/02_UI_SPEC.md` | レトロ風UIの画面仕様 |
| `docs/03_TECHNICAL_DESIGN.md` | 静的Webアプリ、抽選、外部連携の設計 |
| `docs/04_TEST_PLAN.md` | 受入条件、テストケース |
| `docs/05_DEPLOYMENT_RUNBOOK.md` | Xサーバー公開、更新、切り戻し |
| `docs/06_OPERATIONS_ANALYTICS.md` | GA4、KPI、変更管理 |
| `docs/07_ASSET_POLICY_CHECKLIST.md` | 素材、権利、表示文言、広告確認 |
| `docs/08_OPEN_ITEMS.md` | 公開前に入力・確認する項目 |
| `docs/09_INTEGRATION_CONFIG_GUIDE.md` | カンパ、AdSense、GA4の設定方法 |
| `docs/10_REVIEW_REPORT.md` | 旧版の問題点と修正結果 |
| `AGENTS.md` | AI開発エージェント向けルール |
| `templates/app-config.example.js` | 設定ファイルの例 |
| `templates/integration-markers.example.html` | HTML差し込み領域の例 |
| `templates/deployment-file-list.md` | 本番へアップロードするファイル一覧 |
| `assets/retro_ui_concept.png` | 採用するレトロ風UIの参考画像 |
| `source/user_filled_spec.docx` | ユーザー記入済み原本。公開禁止 |

## ステータス

- **確定**: 記入済み原本またはチャットで明示的に確定した内容。
- **暫定決定**: MVPで実装する内容。実装後に調整可能。
- **必須**: 公開品質、セキュリティ、運用整合のため必ず満たす内容。
- **公開前入力**: サービス選定、コード、IDなど、公開前に入力または確認する内容。
