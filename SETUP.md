# Visuy Cast - セットアップガイド

## 前提条件

- Node.js 18以上がインストールされていること
- Firebaseアカウントを持っていること
- npmまたはyarnがインストールされていること

## セットアップ手順

### 1. 依存関係のインストール

プロジェクトのルートディレクトリで以下のコマンドを実行します：

```bash
npm install
```

### 2. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例：visuy-cast）
4. Google Analyticsの設定（任意）
5. プロジェクトを作成

### 3. Firebase サービスの有効化

#### Authentication の設定

1. Firebase Console で「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを選択
4. 以下のプロバイダーを有効化：
   - メール/パスワード
   - Google（任意）

#### Firestore Database の設定

1. Firebase Console で「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. 「テストモードで開始」を選択（開発用）
4. ロケーションを選択（例：asia-northeast1）
5. 有効化

### 4. Firebase 設定情報の取得

1. Firebase Console のプロジェクト設定（歯車アイコン）を開く
2. 「全般」タブを選択
3. 「アプリ」セクションまでスクロール
4. Webアプリのアイコン（</>）をクリック
5. アプリのニックネームを入力（例：visuy-cast-web）
6. Firebase Hostingは後で設定するのでチェックしない
7. 「アプリを登録」をクリック
8. 表示された設定情報（firebaseConfig）をコピー

### 5. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成します：

```bash
touch .env.local
```

`.env.local` ファイルに以下の内容を記述（Firebase設定情報を入力）：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして、アプリが起動することを確認します。

## Firestore セキュリティルールの設定（重要）

開発が進んだら、Firestoreのセキュリティルールを設定してください。

Firebase Console で「Firestore Database」→「ルール」を選択し、以下のルールを設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーコレクション
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // スケジュールコレクション
    match /schedules/{scheduleId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // タスクコレクション
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Firebase Hosting へのデプロイ

### 1. Firebase CLI のインストール

```bash
npm install -g firebase-tools
```

### 2. Firebase へのログイン

```bash
firebase login
```

### 3. Firebase プロジェクトの初期化

```bash
firebase init hosting
```

以下の設定を選択：
- プロジェクトを選択
- public directoryは「out」と入力
- single-page appとして設定: No
- GitHub Actionsの設定: No（任意）

### 4. Next.js の静的エクスポート設定

`next.config.ts` ファイルを確認：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### 5. ビルドとデプロイ

```bash
npm run build
firebase deploy
```

デプロイが完了すると、公開URLが表示されます。

## トラブルシューティング

### Firebase接続エラー

- `.env.local` ファイルが正しく作成されているか確認
- 環境変数の名前が `NEXT_PUBLIC_` で始まっているか確認
- Firebase プロジェクトの設定が正しいか確認

### ビルドエラー

- Node.js のバージョンを確認（18以上が必要）
- `node_modules` を削除して再インストール：
  ```bash
  rm -rf node_modules
  npm install
  ```

### Authentication エラー

- Firebase Console でメール/パスワード認証が有効になっているか確認
- 必要に応じて、承認済みドメインに `localhost` が含まれているか確認

## 次のステップ

セットアップが完了したら、以下の開発を進めてください：

1. ✅ 基本環境構築（完了）
2. ✅ 認証機能（完了）
3. ✅ 4象限マッピングUI（完了）
4. ⬜ 天気予報機能の実装
5. ⬜ AIスケジューリング機能
6. ⬜ 分析機能
7. ⬜ プロフィール・共有機能

詳細は `IMPLEMENTATION_SCHEDULE.md` を参照してください。

## サポート

質問や問題がある場合は、プロジェクトチームに連絡してください。

