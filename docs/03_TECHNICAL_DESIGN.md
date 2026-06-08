# 03. 技術設計

## 1. 基本方針

新版はWordPressと分離した静的Webアプリです。Xサーバーの`public_html/race-game/`へ、HTML、CSS、JavaScript、画像、公開用設定ファイルだけを配置します。

WordPressの`functions.php`、テーマ、プラグインは原則変更しません。WordPress側は必要に応じて新版URLへのリンクを追加するだけです。

## 2. 推奨構成

```text
public_html/race-game/
├── index.html
├── assets/
│   ├── css/app.css
│   ├── js/
│   │   ├── app.js
│   │   ├── core/
│   │   │   ├── random.js
│   │   │   ├── race-engine.js
│   │   │   └── storage.js
│   │   ├── ui/render.js
│   │   └── integrations/
│   │       ├── analytics.js
│   │       ├── donation.js
│   │       └── adsense.js
│   └── images/
│       ├── horse-sprite.webp
│       ├── track-texture.webp
│       ├── goal-marker.webp
│       └── ui-icons.svg
└── config/app-config.js
```

AI開発用の`docs/`、`source/`、バックアップ、秘密情報は公開しません。

## 3. 開発時の起動

ES modulesを使う場合、`file://`ではなくHTTPで確認します。

```bash
cd race-game
python3 -m http.server 8000
# http://localhost:8000/ を開く
```

## 4. 設定ファイル

```js
window.RACE_GAME_CONFIG = {
  app: {
    title: '競馬ランダム抽選',
    subtitle: 'レトロ競走シミュレーター',
    minRunners: 2,
    maxRunners: 18,
    defaultRunners: 12,
    raceDurationMs: 10000,
    quickRunnerOptions: [5, 8, 12, 18],
    savePreviousResult: true
  },
  donation: {
    enabled: false,
    provider: 'external-link',
    url: '',
    buttonLabel: 'このゲームを応援する',
    openInNewTab: true
  },
  adsense: {
    enabled: false,
    strategy: 'manual-result-slot',
    client: '',
    resultSlot: '',
    showDevelopmentPlaceholder: true,
    mountOncePerPageView: true
  },
  analytics: {
    enabled: false,
    mode: 'gtag',
    measurementId: '',
    sendPageView: true
  }
};
```

公開されるJavaScriptへ秘密鍵や管理用トークンを置きません。

## 5. 状態

```js
{
  screen: 'setup' | 'race' | 'result',
  runnerCount: 12,
  favoriteModeEnabled: false,
  favoriteRunner: null,
  finalOrder: [],
  previousResult: null,
  raceStartedAt: null,
  skipped: false
}
```

## 6. 抽選

### 通常モード

```text
[1 ... runnerCount]
  -> secureShuffle
  -> finalOrder
```

### 推し馬指定モード

```text
[1 ... runnerCount]
  -> 推し馬を除外
  -> 残りをsecureShuffle
  -> 推し馬を先頭へ追加
  -> finalOrder
```

- `secureShuffle`は`crypto.getRandomValues()`を使用する。
- 剰余による偏りを避ける。
- Crypto APIが利用できない場合は`Math.random()`へ黙ってフォールバックせず、エラー表示する。
- HTTPSの本番環境で動作確認する。

## 7. 演出

1. 開始時に`finalOrder`を確定する。
2. 前半、中盤、終盤の表示位置を生成する。
3. 中間順位だけ演出として変える。
4. ゴールは`finalOrder`どおりにする。
5. スキップ時はタイマー、`requestAnimationFrame`、イベントを停止し、同じ`finalOrder`を表示する。
6. `game_complete`は1レースにつき1回だけ送る。

## 8. カンパ

- `donation.enabled`が`true`で、HTTPS URLが有効な場合だけカードを表示する。
- `provider`は初期版で`external-link`とする。
- 外部リンクは新しいタブで開き、`rel="noopener noreferrer"`を付ける。
- サービス固有ウィジェットが必要になった場合は`integrations/donation.js`だけを拡張する。

## 9. AdSense

### 方針

- 手動広告ユニットを結果画面下に表示する。
- 広告連携は`integrations/adsense.js`へ分離する。
- 広告は1ページビューにつき初回だけマウントする。
- リプレイで広告を自動更新しない。
- Auto adsが既存サイトで有効な場合は、`/race-game/`のページ除外を検討する。

### 後付け設定

AdSense管理画面から取得した`ca-pub-...`と広告ユニットの`data-ad-slot`を`app-config.js`へ設定します。サイト接続用コードまたはメタタグが必要な場合は、`index.html`の`ADSENSE_HEAD_CODE`マーカー間へ貼り付けます。

### 本番ラベル

広告枠の見出しは`広告`とします。`応援`、`スポンサー`、`おすすめリンク`など、広告クリックを促すように見える表現は使いません。

## 10. GA4

静的HTMLはWordPressテーマの`<head>`を使わないため、WordPress側のGA4コードが自動継承されると仮定しません。

- `analytics.js`は未設定でもゲームを継続する。
- `gtag`を使う場合は測定IDを設定する。`analytics.js`がgtagタグを読み込み、初期`config`を送信する。
- GTMを使う場合は`index.html`の専用マーカーへコードを追加し、必要に応じて`dataLayer`へイベントを送る。
- PIIを送信しない。

## 11. localStorage

キー:

```text
umano_ie_race_game_previous_result_v1
```

例:

```json
{
  "runnerCount": 12,
  "mode": "favorite",
  "favoriteRunner": 7,
  "topFive": [7, 12, 3, 10, 5],
  "completedAt": "2026-06-07T12:34:56+09:00"
}
```

読み書きは`try/catch`で保護し、失敗してもゲームを継続します。

## 12. HTML差し込みマーカー

`templates/integration-markers.example.html`を参照してください。
