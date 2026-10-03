import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const gasUrl = process.env.GAS_NOTIFY_URL;
    const gasToken = process.env.GAS_NOTIFY_TOKEN;

    if (!gasUrl || !gasToken) {
      console.error('GAS_NOTIFY_URL または GAS_NOTIFY_TOKEN が未設定です');
<<<<<<< HEAD

      return NextResponse.json(
        {
          ok: false,
          message: 'メール通知の設定が未完了です。'
        },
=======
      return NextResponse.json(
        { ok: false, message: 'メール通知の設定が未完了です。' },
>>>>>>> 41aa9165dccf2e5a81c716c77f6baac3e1e070ad
        { status: 503 }
      );
    }

    const body = await request.json();

<<<<<<< HEAD
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
=======
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
>>>>>>> 41aa9165dccf2e5a81c716c77f6baac3e1e070ad
      })
    });

    const responseText = await response.text();
    let result: any = {};
<<<<<<< HEAD
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
=======

    try {
      result = JSON.parse(responseText);
    } catch {
>>>>>>> 41aa9165dccf2e5a81c716c77f6baac3e1e070ad
      console.error('GASからのレスポンス解析失敗:', responseText);
    }

    if (!response.ok || !result.ok) {
      console.error('GAS notification error:', result);
<<<<<<< HEAD

      return NextResponse.json(
        {
          ok: false,
          message: 'メール送信に失敗しました。'
        },
=======
      return NextResponse.json(
        { ok: false, message: 'メール送信に失敗しました。' },
>>>>>>> 41aa9165dccf2e5a81c716c77f6baac3e1e070ad
        { status: 502 }
      );
    }

<<<<<<< HEAD
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
=======
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { ok: false, message: 'メール通知処理でエラーが発生しました。' },
>>>>>>> 41aa9165dccf2e5a81c716c77f6baac3e1e070ad
      { status: 500 }
    );
  }
}
