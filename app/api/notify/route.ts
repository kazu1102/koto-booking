import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const gasUrl = process.env.GAS_NOTIFY_URL;
    const gasToken = process.env.GAS_NOTIFY_TOKEN;

    if (!gasUrl || !gasToken) {
      console.error('GAS_NOTIFY_URL または GAS_NOTIFY_TOKEN が未設定です');
      return NextResponse.json(
        { ok: false, message: 'メール通知の設定が未完了です。' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // GASへのPOST送信（Resendは使用せず、GAS経由でGmail送信）
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      redirect: 'follow',
      body: JSON.stringify({
        token: gasToken,
        ...body
      })
    });

    const responseText = await response.text();
    let result: any = {};

    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('GASからのレスポンス解析失敗:', responseText);
    }

    if (!response.ok || !result.ok) {
      console.error('GAS notification error:', result);
      return NextResponse.json(
        { ok: false, message: 'メール送信に失敗しました。' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { ok: false, message: 'メール通知処理でエラーが発生しました。' },
      { status: 500 }
    );
  }
}
