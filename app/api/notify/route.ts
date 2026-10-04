import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Gmail送信用トランスポートの設定
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { menu, price, duration, date, time, name, phone, email, symptom } = body;

    // メール本文の作成
    const emailContent = `
${name} 様

鍼灸整体院 琴 でございます。
この度はご予約いただき、誠にありがとうございます。

以下の内容でご予約を承りました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご予約内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【日時】${date} ${time}〜
【メニュー】${menu} (${duration}分)
【料金】¥${price.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お客様情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【お名前】${name} 様
【電話番号】${phone}
${symptom ? `【お悩み・症状】\n${symptom}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
当日のご来院を心よりお待ちしております。
ご予約の変更・キャンセルはお電話または公式LINEよりご連絡ください。

鍼灸整体院 琴
    `;

    // 1. 患者さん（予約者）宛ての自動返信メール
    if (email && email.trim() !== '') {
      await transporter.sendMail({
        from: `"鍼灸整体院 琴" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '【鍼灸整体院 琴】ご予約完了のお知らせ',
        text: emailContent,
      });
    }

    // 2. 院（管理者）宛ての予約通知メール（あなたとけんたさんの両方に送信）
    const adminEmails = [
      process.env.GMAIL_USER,
      'sinkyuseitaikoto@gmail.com' // ★ここをけんたさんの実際のメアドに変更してください
    ].filter(Boolean);

    await transporter.sendMail({
      from: `"予約通知システム" <${process.env.GMAIL_USER}>`,
      to: adminEmails.join(','), // カンマ区切りで複数人に同時送信
      subject: `【新規予約】${name} 様 (${date} ${time})`,
      text: `Web予約サイトから新しい予約が入りました。\n\n${emailContent}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 });
  }
}
