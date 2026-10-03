import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const gasUrl = process.env.GAS_NOTIFY_URL;
    const gasToken = process.env.GAS_NOTIFY_TOKEN;

    if (!gasUrl || !gasToken) {
      console.error('GAS_NOTIFY_URL または GAS_NOTIFY_TOKEN が未設定です');

      return NextResponse.json(
        {
          ok: false,
          message: 'メール通知の設定が未完了です。'
        },
        { status: 503 }
      );
    }

    const body = await request.json();

    const {
      menu,
      price,
      duration,
      date,
      time,
      name,
      phone,
      email
    } = body ?? {};

    // 必須項目チェック
    if (
      !menu ||
      typeof price !== 'number' ||
      typeof duration !== 'number' ||
      !date ||
      !time ||
      !name ||
      !phone
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: '予約情報が不足しています。'
        },
        { status: 400 }
      );
    }

    // GASへのPOST送信（リダイレクトを安全に追従する設定を追加）
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // GASのCORS/POST制限を回避するための指定
      },
      redirect: 'follow', // GASのリダイレクト(302)を正しく追従
      body: JSON.stringify({
        token: gasToken,
        menu,
        price,
        duration,
        date,
        time,
        name,
        phone,
        email
      })
    });

    const responseText = await response.text();
    let result: any = {};
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('GASからのレスポンス解析失敗:', responseText);
    }

    if (!response.ok || !result.ok) {
      console.error('GAS notification error:', result);

      return NextResponse.json(
        {
          ok: false,
          message: 'メール送信に失敗しました。'
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true
    });

  } catch (error) {
    console.error('Notification error:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'メール通知処理でエラーが発生しました。'
      },
      { status: 500 }
    );
  }
}
