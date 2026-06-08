# 06. 運用・アクセス解析

## 1. 目的

リニューアルにより、繰り返しプレイが増えるか、推し馬指定が使われるか、カンパ導線が反応を得るか、広告配置が操作性を損なわないかを確認します。

## 2. KPI

| KPI | 計算 |
|---|---|
| 1訪問あたりプレイ数 | `game_start / visits` |
| 結果表示率 | `game_complete / game_start` |
| スキップ率 | `skip_animation / game_start` |
| リプレイ率 | `replay / game_complete` |
| 推し馬指定率 | favorite modeの`game_start / 全game_start` |
| カンパクリック率 | `donation_button_click / game_complete` |

## 3. イベントパラメータ

| イベント | 主なパラメータ |
|---|---|
| `game_start` | `runner_count`, `mode`, `favorite_runner` |
| `game_complete` | `runner_count`, `mode`, `favorite_runner`, `skipped` |
| `replay` | `runner_count`, `mode` |
| `skip_animation` | `runner_count`, `elapsed_ms` |
| `runner_count_select` | `runner_count`, `input_method` |
| `donation_button_click` | `location`, `provider` |
| `favorite_horse_toggle` | `enabled` |
| `favorite_horse_select` | `favorite_runner` |

必要なパラメータをGA4のレポートで分析する場合は、カスタムディメンションの設定を検討します。PIIは送りません。

## 4. 月次記録

| 項目 | 記録元 |
|---|---|
| 訪問数、イベント | GA4 |
| カンパ件数・金額 | 外部サービス |
| AdSense収益 | AdSense |
| サーバー・ドメイン費 | 会計記録 |
| 変更内容、公開日、切り戻し先 | Gitまたは運用メモ |

## 5. 改善ルール

- 演出時間、カンパ文言、広告配置を同時に大きく変更しない。
- 変更は主要要素1つずつ行う。
- AdSense変更時はスマートフォンで操作付近の表示を確認する。
- Auto adsの設定変更も記録する。
