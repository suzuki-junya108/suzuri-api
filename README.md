# SUZURI API Server

アップロードされた画像からSUZURIの商品を作成するためのAPIサーバーです。

## 概要

このAPIサーバーは、画像をアップロードし、SUZURIの商品を自動的に作成するためのRESTful APIを提供します。Next.jsとTypeScriptで構築されており、Swagger UIによるAPIドキュメントも含まれています。

## 主な機能

- 画像のアップロード（JPEG、PNG、WebP対応）
- SUZURIへの商品登録
- 商品情報の取得
- Swagger UIによるAPIドキュメント

## セットアップ

### 必要条件

- Node.js 18以上
- npm または yarn
- SUZURI APIのアクセスキー

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
```

`.env.local`ファイルを編集し、SUZURI APIキーを設定してください：

```
SUZURI_API_KEY=your_api_key_here
```

APIキーは[SUZURI開発者ページ](https://suzuri.jp/developer/apps)から取得できます。

### 開発サーバーの起動

```bash
npm run dev
```

サーバーは http://localhost:3000 で起動します。

## API エンドポイント

### 画像アップロード

```
POST /api/upload
```

画像ファイルをアップロードします。

**リクエスト**
- Content-Type: `multipart/form-data`
- Body: `file` (画像ファイル)

**レスポンス**
```json
{
  "success": true,
  "file": {
    "name": "upload_1234567890.png",
    "path": "/path/to/file",
    "size": 123456,
    "width": 1920,
    "height": 1080,
    "format": "png"
  }
}
```

### 商品作成（一括処理）

```
POST /api/create-product
```

画像のアップロードとSUZURIへの商品作成を一度のリクエストで行います。

**リクエスト**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (必須): 画像ファイル（JPEG、PNG、WebP）
  - `title` (必須): 商品タイトル
  - `description` (オプション): 商品の説明
  - `published` (オプション): 公開状態（デフォルト: true）
  - `resizeMode` (オプション): リサイズモード（"contain" または "cover"、デフォルト: "contain"）
  - `itemId` (オプション): 商品タイプID（デフォルト: 1=Tシャツ、詳細は `/api/items` を参照）

**レスポンス**
```json
{
  "success": true,
  "product": {
    "id": 12345,
    "title": "商品タイトル",
    "url": "https://suzuri.jp/...",
    "sampleImageUrl": "https://...",
    "published": true
  },
  "item": {
    "id": 1,
    "name": "Tシャツ",
    "variants": [
      {
        "id": 123,
        "color": "ホワイト",
        "size": "M",
        "price": 3000
      }
    ]
  },
  "uploadedImage": {
    "id": 67890,
    "url": "https://...",
    "width": 1920,
    "height": 1080
  }
}
```

### 商品作成（分割処理）

```
POST /api/products
```

事前にアップロードした画像からSUZURIの商品を作成します。

**リクエスト**
```json
{
  "imagePath": "/path/to/uploaded/image",
  "title": "商品タイトル",
  "description": "商品の説明（オプション）",
  "published": true,
  "resizeMode": "contain",
  "itemId": 1
}
```

**レスポンス**
```json
{
  "success": true,
  "product": {
    "id": 12345,
    "title": "商品タイトル",
    "url": "https://suzuri.jp/...",
    "sampleImageUrl": "https://...",
    "published": true
  },
  "item": {
    "id": 1,
    "name": "Tシャツ",
    "variants": [
      {
        "id": 123,
        "color": "ホワイト",
        "size": "M",
        "price": 3000
      }
    ]
  }
}
```

### 商品情報取得

```
GET /api/products?id={productId}
```

特定の商品情報を取得します。

```
GET /api/products
```

商品情報を取得します（ID指定なしの場合は利用可能なアイテムタイプの一覧）。

### 利用可能な商品タイプ

```
GET /api/items
```

SUZURI で作成可能な商品タイプの一覧を取得します。

**レスポンス例**
```json
{
  "items": [
    {
      "id": 1,
      "name": "スタンダードTシャツ",
      "exemplaryAngle": "front",
      "published": true,
      "variantCount": 25
    },
    {
      "id": 2,
      "name": "フーディ",
      "exemplaryAngle": "front",
      "published": true,
      "variantCount": 15
    }
    // ... その他の商品タイプ
  ]
}
```

## API ドキュメント

Swagger UIでAPIドキュメントを確認できます：

http://localhost:3000/swagger

## 使用例

### cURLを使用した例

```bash
# 利用可能な商品タイプを確認
curl -X GET http://localhost:3000/api/items

# 一度のリクエストで商品を作成（推奨）
curl -X POST http://localhost:3000/api/create-product \
  -F "file=@/path/to/image.png" \
  -F "title=オリジナルTシャツ" \
  -F "description=カスタムデザインのTシャツです" \
  -F "published=true" \
  -F "itemId=1"

# 画像のアップロード（分割処理の場合）
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.png"

# 商品の作成（分割処理の場合）
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "imagePath": "/tmp/upload_1234567890.png",
    "title": "オリジナルTシャツ",
    "description": "カスタムデザインのTシャツです"
  }'
```

### JavaScriptを使用した例

```javascript
// 利用可能な商品タイプを確認
const itemsResponse = await fetch('/api/items');
const { items } = await itemsResponse.json();
console.log('利用可能な商品タイプ:', items);

// 一度のリクエストで商品を作成（推奨）
const formData = new FormData();
formData.append('file', imageFile);
formData.append('title', 'オリジナルTシャツ');
formData.append('description', 'カスタムデザインのTシャツです');
formData.append('published', 'true');
formData.append('itemId', '1'); // 1=Tシャツ, 他のIDは /api/items で確認

const response = await fetch('/api/create-product', {
  method: 'POST',
  body: formData
});
const result = await response.json();

console.log('作成された商品URL:', result.product.url);

// 分割処理の場合
// 1. 画像のアップロード
const uploadFormData = new FormData();
uploadFormData.append('file', imageFile);

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: uploadFormData
});
const uploadResult = await uploadResponse.json();

// 2. 商品の作成
const productResponse = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imagePath: uploadResult.file.path,
    title: 'オリジナルTシャツ'
  })
});
const productResult = await productResponse.json();
```

## デプロイ

### Vercelへのデプロイ

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel
```

環境変数をVercelのダッシュボードで設定することを忘れないでください。

## 開発

### ビルド

```bash
npm run build
```

### プロダクション実行

```bash
npm start
```

### リント

```bash
npm run lint
```

## トラブルシューティング

### 画像アップロードエラー

- ファイルサイズが10MBを超えていないか確認してください
- 対応フォーマット（JPEG、PNG、WebP）であることを確認してください

### SUZURI API エラー

- 環境変数が正しく設定されているか確認してください
- APIキーが有効であることを確認してください

## ライセンス

MIT