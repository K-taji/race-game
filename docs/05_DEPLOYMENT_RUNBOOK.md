# 05. Xサーバー公開・切り戻し手順

## 1. 公開方針

WordPress本体を原則変更せず、`public_html/race-game/`へ静的Webアプリを配置します。正規URLは`https://umano-ie.com/race-game/`です。

## 2. 現在の公開判定

公開前のローカル検証は通過済みです。

| 確認項目 | 結果 |
|---|---|
| 単体テスト | `npm test` 全5ファイル通過 |
| 抽選ロジック | `crypto.getRandomValues`利用、範囲検証あり |
| XSS対策 | 設定値、前回結果、カンパリンクのエスケープテスト通過 |
| 危険URL対策 | カンパURLはHTTPSのみ許可 |
| localStorage改ざん | 前回結果の型・範囲検証あり |
| 公開対象 | `public_html/race-game/`内に`source/`、`.docx`、`.md`、ZIPなし |
| 外部npm依存 | なし |

本番サーバー固有のHTTPヘッダー、HSTS、CSP、ディレクトリリスティングはXサーバー上で公開後に確認してください。

## 3. 本番へ置くもの

```text
race-game/
├── index.html
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
└── config/
```

`docs/`、`templates/`、`source/`、開発メモ、ZIPバックアップ、秘密情報は本番へ置きません。

## 4. 本番アップロード対象ファイル

```text
race-game/index.html
race-game/assets/css/app.css
race-game/assets/images/horse-face.png
race-game/assets/js/app.js
race-game/assets/js/core/race-engine.js
race-game/assets/js/core/random.js
race-game/assets/js/core/storage.js
race-game/assets/js/integrations/adsense.js
race-game/assets/js/integrations/analytics.js
race-game/assets/js/integrations/donation.js
race-game/assets/js/ui/render.js
race-game/config/app-config.js
```

## 5. 初回公開前

1. Xサーバーの対象ドメイン配下に`public_html`があることを確認する。
2. `public_html/race-game/`が未使用であることを確認する。既に存在する場合は、上書き前に必ずバックアップする。
3. `public_html/.htaccess`をダウンロードしてバックアップし、WordPressの標準リライトルールと競合しないことを確認する。
4. `/tool01/`とブログが正常であることを確認する。
5. GA4の既存導入方法、測定ID、GTM利用有無を確認する。
6. AdSenseのサイトコード、Auto ads利用有無、ads.txtを確認する。
7. プライバシーポリシーにGA4、AdSense、外部カンパ導線を反映する必要がないか確認する。

## 6. ローカル確認

```bash
cd public_html
python3 -m http.server 8000
```

ブラウザで`http://localhost:8000/race-game/`を開き、次を確認します。

1. タイトルが`競馬ランダム抽選`である。
2. 通常モードでレース開始、結果表示、リプレイができる。
3. 推し馬指定ONで番号選択後に開始できる。
4. レース中に馬の顔画像とゴール側の馬番が見える。
5. 実況が複数パターンで表示され、最後の実況で勝敗が分からない。
6. スマートフォン幅で横スクロールが出ない。
7. ブラウザの開発者ツールConsoleにエラーが出ない。

## 7. Xサーバー ファイルマネージャーでの初回公開

1. Xサーバーのサーバーパネルへログインする。
2. `ファイル管理`を開く。
3. 対象ドメインの`public_html/`へ移動する。
4. `race-game/`フォルダを作成する。既にある場合は、まず`race-game_backup_YYYYMMDD/`などへコピーまたはリネームする。
5. 成果物ZIPを手元で展開し、中の`race-game/`配下のファイルをXサーバーの`public_html/race-game/`へアップロードする。
6. フォルダ構成が`public_html/race-game/index.html`になることを確認する。`public_html/race-game/race-game/index.html`の二重フォルダにしない。
7. `docs/`、`templates/`、`source/`、README、ZIPファイルを本番へ置いていないことを確認する。
8. `https://umano-ie.com/race-game/`を直接開く。

## 8. FTP/SFTPでの初回公開

1. FTP/SFTPクライアントで対象ドメインの`public_html/`へ接続する。
2. ローカルの成果物ZIPを展開する。
3. 展開された`race-game/`フォルダを、サーバーの`public_html/`直下へアップロードする。
4. アップロード後の入口が`public_html/race-game/index.html`であることを確認する。
5. `source/`や開発用ドキュメントがアップロードされていないことを確認する。

## 9. 公開直後の確認

1. `https://umano-ie.com/race-game/`を開く。
2. `https://umano-ie.com/race-game`へアクセスした場合も意図通り表示またはリダイレクトされるか確認する。
3. `/tool01/`、トップページ、主要ブログ記事が正常に表示されることを確認する。
4. 通常モード、推し馬指定、リプレイ、スキップを確認する。
5. PCとスマートフォンでレース中の馬の顔画像、ゴール側馬番、実況、結果画面を確認する。
6. ブラウザの開発者ツールConsoleに404やJavaScriptエラーが出ていないことを確認する。
7. 画像`/race-game/assets/images/horse-face.png`が表示できることを確認する。
8. `/race-game/source/`、`/race-game/docs/`、`/race-game/templates/`が存在しないことを確認する。
9. GA4を使う場合は`config/app-config.js`へ測定IDを入れ、DebugViewで`game_start`、`game_complete`などを確認する。
10. AdSenseを使わない場合は広告プレースホルダーだけであることを確認する。
11. AdSenseを使う場合は手動広告ユニットを設定し、Auto adsがゲーム操作付近へ出ていないことを確認する。
12. 問題がなければ、WordPress記事やメニューから新版へ誘導する。

## 10. GA4を有効化する場合

`public_html/race-game/config/app-config.js`の`analytics`を次のように設定します。

```js
analytics: {
  enabled: true,
  mode: 'gtag',
  measurementId: 'G-XXXXXXXXXX',
  sendPageView: true
}
```

測定IDはGA4管理画面のデータストリームから取得します。`G-`で始まるID以外は使いません。

## 11. 更新

安全性を上げる場合、次の手順を使います。

1. 本番`race-game/`を公開領域外へバックアップする。
2. 新版を`race-game_next/`へアップロードする。
3. 新版を直接確認する。
4. 問題なければ、旧`race-game/`を公開領域外へ退避し、`race-game_next/`を`race-game/`へ変更する。
5. `/race-game/`、`/tool01/`、ブログを確認する。
6. 変更日時、変更内容、切り戻し先を記録する。

## 12. 切り戻し

1. WordPress側の新版リンクを外す。
2. 必要に応じて現行`race-game/`を退避する。
3. バックアップ済みの旧`race-game/`を戻す。
4. `/tool01/`、`/race-game/`、ブログを確認する。

## 13. AdSense追加時

1. `index.html`をバックアップする。
2. 必要なサイト接続用コードまたはメタタグを`ADSENSE_HEAD_CODE`マーカーへ追加する。
3. `app-config.js`へ`client`と`resultSlot`を設定する。
4. `adsense.enabled`を`true`にする。
5. Auto adsが有効な場合、`/race-game/`で意図しない広告を確認し、必要ならページ除外する。
6. 広告がリプレイで自動更新されないことを確認する。
7. ads.txtが必要な場合はドメインルートの既存ファイルを確認してから変更する。

## 14. カンパ追加時

1. 外部サービスを選ぶ。
2. HTTPS URLを取得する。
3. `donation.url`へ設定する。
4. `donation.enabled`を`true`にする。
5. 新しいタブ、GA4イベント、文言、広告との分離を確認する。
