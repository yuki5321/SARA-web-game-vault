# Webゲーム倉庫

Astroで生成する静的ゲームポータルです。掲載ゲームは単一HTMLの独立したドキュメントとして配信し、ゲームごとの説明ページはビルド時に生成します。

## 開発

```sh
npm install
npm run dev
npm run build
npm run preview
```

Cloudflare Pagesではビルドコマンドに `npm run build`、出力ディレクトリに `dist` を指定します。Node.jsは22.12.0以上を使用してください（Pagesの環境変数 `NODE_VERSION` に `22.12.0` を指定できます）。独自ドメインを設定したら、ビルド環境変数 `SITE_URL` に `https://example.com` のようなサイトURLを設定してください。設定するとcanonical URL、サイトマップ、`robots.txt` のサイトマップ参照が生成されます。Cloudflare Pagesの `CF_PAGES_URL` がある場合はプレビュー用URLを使います。どちらもないローカルビルドではサイトマップを出力せず、誤ったURLを公開しません。

## ゲームの追加

1. `public/games/<slug>/game.json` にメタデータを追加します。
2. 同じディレクトリに単一HTMLの `game.html` を置きます。
3. `game.json` の `id` を `<slug>` と一致させ、必須情報、タグ、画面比率、公開日を入力します。
4. `npm run build` を実行します。不正なJSON、必須項目の欠落、IDの不一致、ゲームHTMLの欠落などはビルド時にエラーになります。

Astroが `/games/<slug>/` の説明ページを `dist/games/<slug>/index.html` に生成するため、ゲーム本体は同じ出力先で衝突しないよう `game.html` としています。iframeには `allow="fullscreen"` のみを付与し、追加権限はゲームが必要とする場合に限り検討します。

### 自作ゲームを追加する場合

1. `public/games/<好きな英数字のスラッグ>/` フォルダーを作ります（小文字英数字とハイフンのみ）。
2. ゲームを1つのHTMLファイルにまとめ、`game.html` として置きます。CSS・JavaScriptはHTML内に記述し、画像は `<img>` のデータURIかCSS・Canvas描画で表現するとファイルが1つで済みます。複数ファイルになる場合は同じフォルダーに置き、`game.html` から相対パスで参照します。
3. 同じフォルダーに `game.json` を作り、既存のゲームをコピーして内容を書き換えます。
4. サムネイル（400×300程度）を `thumbnail.png` として置く場合は、`game.json` に `"thumbnail": "/games/<スラッグ>/thumbnail.png"` を追加します。
5. `npm run dev` で表示を確認し、`npm run build` を通してからコミット・pushします。Cloudflareが自動でデプロイします。

Phaserなどのライブラリを使う場合はCDNの信頼できる配信元のみを利用し、スマートフォンでの画面拡縮・タッチ座標（`getBoundingClientRect()` 経由）を確認してください。

各ゲームのlocalStorageキーは `vault_<slug>_best` を使用します。ゲームは自サイト内で管理する信頼済みコードのみ掲載してください。

## 広告と問い合わせ

広告枠は配置確認用のプレースホルダーです。AdSenseの審査・承認後、管理画面から発行された広告コードを追加してください。`public/ads.txt` はアカウント承認後にGoogleが指定する正確な販売者情報へ置き換えます。広告表示のための自動再読み込みや誤クリックを誘う配置は行いません。

プライバシーポリシーは現時点の機能と今後導入予定の広告について記載しています。広告や解析を実際に有効化する際は、配信設定に合わせて内容を更新してください。お問い合わせフォームはURLが準備できてから公開します。
