# 予約メール通知の設定

1. Resendでアカウントを作成し、API Keyを発行します。
2. プロジェクト直下の `.env.local` に以下を追加します（既存のSupabase 2行は消さないでください）。

```
RESEND_API_KEY=re_発行したAPIキー
BOOKING_NOTIFICATION_EMAILS=kazukazu1102246@gmail.com
```

後日、けんたさんにも通知する場合はカンマ区切りで追加します。

```
BOOKING_NOTIFICATION_EMAILS=kazukazu1102246@gmail.com,けんたさんのメールアドレス
```

3. Resendのテスト送信元 `onboarding@resend.dev` は、Resendのアカウントで許可された宛先へのテスト用途です。本番運用で確実に送るには、Resendで院の所有ドメインを認証し、API送信元を認証済みドメインのアドレスに変更してください。
4. `.env.local` を保存後、開発サーバーを停止（ターミナルで Control+C）して `npm run dev` で再起動します。

APIキーはブラウザ側の `NEXT_PUBLIC_` 変数にしないでください。また、APIキーをチャットに貼らないでください。

注意：現段階のメール通知は予約登録後に通知APIを呼び出す簡易実装です。本番公開前に、メール送信の再試行・不正な大量送信への対策・管理画面の認証とデータベースのアクセス制御を確認してください。
