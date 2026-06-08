# 本番アップロード対象

本番の`public_html/race-game/`へアップロードするもの:

```text
race-game/
├── index.html
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
└── config/
```

現時点のファイル:

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

アップロードしないもの:

- `docs/`
- `templates/`
- `source/`
- `README.md`
- `AGENTS.md`
- ZIPバックアップ
- 開発用ログ
- 秘密情報
