# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code)への指針を提供します。

## プロジェクト概要

これは、アップロードされた画像からSUZURIの商品を作成するために設計されたNext.js APIプロジェクトです。APIは画像を受け取り、商品ページのURLと関連情報を返します。

**現在のステータス**: 開発前段階 - プロジェクト構造の初期化が必要です。

## プロジェクトセットアップコマンド

プロジェクトがまだ初期化されていないため、セットアップに必要なコマンドは以下の通りです：

```bash
# Next.jsプロジェクトの初期化
npx create-next-app@latest . --typescript --app --no-src-dir --import-alias "@/*"

# 依存関係のインストール（初期化後）
npm install

# Swagger関連パッケージのインストール
npm install @types/swagger-ui-react swagger-ui-react next-swagger-doc

# 開発サーバーの実行
npm run dev

# プロダクション用ビルド
npm run build

# プロダクションビルドの実行
npm start
```

## アーキテクチャ概要

### 計画された構造
- **フレームワーク**: App Routerを使用したNext.js
- **デプロイ**: Vercel
- **API統合**: SUZURI API (https://suzuri.jp/developer/documentation/v1)
- **主要機能**: 画像アップロード → SUZURI商品作成 → 商品URLの返却

### API設計の考慮事項
1. **画像アップロードエンドポイント**: 画像アップロード用のmultipart/form-dataを処理する必要があります
2. **SUZURI API統合**: API認証情報が必要（環境変数に保存）
3. **レスポンス形式**: SUZURI商品URLとメタデータを返す必要があります

### 環境変数
実装時には、`.env.local`ファイルを以下の内容で作成してください：
```
SUZURI_API_KEY=your_api_key_here
```

## 開発ガイドライン

1. **APIルート**: `app/api/`ディレクトリにRoute Handlersを使用してAPIエンドポイントを作成
2. **画像処理**: SUZURIに送信する前の画像最適化には`sharp`などのライブラリの使用を検討
3. **エラーハンドリング**: アップロード失敗やSUZURI APIエラーに対する適切なエラーレスポンスを実装
4. **型安全性**: SUZURI APIレスポンスとリクエストペイロードにTypeScriptインターフェースを使用
5. **APIドキュメント**: SwaggerUIを使用してAPIドキュメントを自動生成し、エンドポイントの仕様を明確化

## 主要な実装エリア

### 1. 画像アップロードハンドラー
- 場所: `app/api/upload/route.ts`
- マルチパートフォームデータの処理
- 画像フォーマットとサイズの検証
- SUZURIの要件に応じた画像処理

### 2. SUZURI統合サービス
- 場所: `lib/suzuri-client.ts`
- SUZURI API呼び出しのラッパー
- 認証処理
- 型安全なAPIレスポンス

### 3. 商品作成エンドポイント
- 場所: `app/api/products/route.ts`
- SUZURIへの画像アップロードのオーケストレーション
- SUZURI APIを使用した商品作成
- クライアントへの商品情報の返却

### 4. Swagger/OpenAPIドキュメント
- 場所: `app/api/swagger/route.ts`
- SwaggerUIの実装
- OpenAPI仕様の自動生成
- APIエンドポイントのインタラクティブなドキュメント提供