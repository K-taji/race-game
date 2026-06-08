# 09. 外部連携設定ガイド

## 1. 原則

カンパ、AdSense、GA4は抽選ロジックから分離します。外部連携の変更で`core/random.js`と`core/race-engine.js`を変更しないでください。

## 2. カンパ

初期状態:

```js
donation: {
  enabled: false,
  provider: 'external-link',
  url: '',
  buttonLabel: 'このゲームを応援する',
  openInNewTab: true
}
```

サービス決定後、HTTPS URLを入れて`enabled: true`へ変更します。将来ウィジェット連携が必要な場合は`integrations/donation.js`へproviderアダプターを追加します。

## 3. AdSense

### 推奨方式

結果画面下の手動広告ユニットを1ページビューにつき1回だけマウントします。リプレイで再マウントしません。

```js
adsense: {
  enabled: false,
  strategy: 'manual-result-slot',
  client: '',
  resultSlot: '',
  showDevelopmentPlaceholder: true,
  mountOncePerPageView: true
}
```

AdSense管理画面から取得した値を設定します。

- `client`: `ca-pub-...`
- `resultSlot`: 広告ユニットの`data-ad-slot`

サイト接続用コードまたはメタタグが必要な場合は、`index.html`の`ADSENSE_HEAD_CODE_START`〜`END`へ貼り付けます。

### Auto ads

既存サイトでAuto adsを利用している場合は、`/race-game/`へ意図しない広告が出ないか確認します。ゲーム画面や操作ボタン近くへ出る場合は、AdSense側でページ除外を設定し、手動広告ユニットだけを使います。

### ads.txt

必要な変更は`race-game/`ではなく、ドメインルートの既存`ads.txt`を確認して行います。既存内容を消さないでください。

## 4. GA4

静的アプリはWordPressテーマのタグを自動では継承しません。

- gtagの場合: `config/app-config.js`で`enabled: true`にし、GA4の測定IDを`measurementId`へ設定する。`analytics.js`がgtagタグを自動で読み込みます。
- GTMの場合: HEADとBODYの専用マーカーへGTMコードを追加する。
- 未設定の場合: イベントを捨ててもゲームは継続する。

```js
analytics: {
  enabled: true,
  mode: 'gtag',
  measurementId: 'G-XXXXXXXXXX',
  sendPageView: true
}
```

イベントパラメータをGA4のレポートで使う場合は、必要に応じてカスタムディメンションを設定します。

## 5. 差し込みマーカー

`templates/integration-markers.example.html`を参照してください。
