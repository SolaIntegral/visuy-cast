# Visuy Cast - トラブルシューティング

## 予定が反映されない問題

### 修正内容

1. **Firestoreセキュリティルールの設定**
   - `firestore.rules`ファイルを作成し、適切なアクセス権限を設定
   - `firebase deploy --only firestore:rules`でデプロイ完了

2. **クエリの最適化**
   - 複合インデックスが不要な形にクエリを修正
   - クライアント側でのソート処理を追加

3. **デバッグログの追加**
   - データ保存・取得時のログを追加
   - エラーメッセージの詳細化

### 確認方法

#### 1. ブラウザのコンソールを開く

1. https://visuy-cast.web.app にアクセス
2. F12キーまたは右クリック→「検証」でデベロッパーツールを開く
3. 「Console」タブを選択

#### 2. 予定を追加

1. ログイン後、「予定を追加」をクリック
2. タイトルと日付を入力
3. 4象限マッピングUIで負荷を設定
4. 「予定を追加」ボタンをクリック

#### 3. コンソールログを確認

以下のようなログが表示されるはずです：

```
Creating schedule with data: {...}
createSchedule called with userId: xxx
scheduleData: {...}
Saving to Firestore with id: xxx
Schedule saved successfully
Schedule created successfully: {...}
```

エラーが表示された場合は、そのメッセージをコピーしてください。

#### 4. ダッシュボードでデータを確認

ダッシュボードに戻ると、以下のログが表示されます：

```
Loading dashboard data for user: xxx
Date range: ... to ...
Fetched schedules: X items
```

### よくある問題と解決方法

#### 問題1: "Permission denied" エラー

**原因**: Firestoreのセキュリティルールが正しく設定されていない

**解決方法**:
1. Firebase Console (https://console.firebase.google.com/project/visuy-cast/firestore/rules) を開く
2. 以下のルールが設定されているか確認：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /schedules/{scheduleId} {
      allow create: if request.auth != null && 
                      request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && 
                    resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                              resource.data.userId == request.auth.uid;
    }
  }
}
```

3. 「公開」ボタンをクリック

または、コマンドラインから：
```bash
firebase deploy --only firestore:rules
```

#### 問題2: データは保存されるが表示されない

**原因**: 日付範囲のクエリ問題

**確認方法**:
1. ブラウザのコンソールで「Fetched schedules: X items」を確認
2. Xが0より大きい場合、データは取得されている
3. 日付が範囲外の可能性がある

**解決方法**:
- 今日または明日の日付で予定を作成してみる
- スケジュールページ（/dashboard/schedule）で全ての予定を確認

#### 問題3: "Failed to get document" エラー

**原因**: Firebase設定（.env.local）が正しくない

**解決方法**:
1. `.env.local`ファイルを確認
2. Firebase Console のプロジェクト設定から正しい値をコピー
3. 開発サーバーを再起動（`npm run dev`）

#### 問題4: 複合インデックスエラー

**エラーメッセージ例**:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**解決方法**:
1. エラーメッセージ内のリンクをクリック
2. Firebase Console でインデックスを作成
3. 数分待ってから再試行

## デバッグ手順

### 1. Firebase Console でデータを確認

1. https://console.firebase.google.com/project/visuy-cast/firestore/data を開く
2. `schedules`コレクションを選択
3. ドキュメントが作成されているか確認

### 2. ネットワークタブを確認

1. ブラウザのデベロッパーツールで「Network」タブを選択
2. 予定を追加
3. Firestoreへのリクエスト（google.firestore.v1.Firestore）を確認
4. レスポンスがエラーでないか確認

### 3. Authentication状態を確認

コンソールで以下を実行：
```javascript
firebase.auth().currentUser
```

ユーザー情報が表示されれば、認証は正常です。

## サポート

問題が解決しない場合は、以下の情報を収集してください：

1. ブラウザのコンソールログ（エラーメッセージ）
2. ネットワークタブのリクエスト/レスポンス
3. 使用しているブラウザとバージョン
4. 実行した操作の詳細手順

## 追加のデバッグコマンド

### Firestoreデータの確認
```bash
firebase firestore:delete --project visuy-cast --recursive /schedules
```
（注意：全データが削除されます）

### セキュリティルールのテスト
Firebase Console の「Rules Playground」で、ルールが正しく機能するかテストできます。

