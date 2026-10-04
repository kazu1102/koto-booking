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

    // --------------------------------------------------
    // 1. 患者さん用メール（自動返信）
    // --------------------------------------------------
    if (email && email.trim() !== '') {
      const patientHtml = `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
          <p><strong>${name} 様</strong></p>
          <p>鍼灸整体院 琴 でございます。<br>この度はご予約いただき、誠にありがとうございます。</p>
          <p>以下の内容でご予約を承りました。</p>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 5px;">■ ご予約内容</h3>
            <p style="margin: 5px 0;"><strong>【日時】</strong> ${date} ${time}〜</p>
            <p style="margin: 5px 0;"><strong>【メニュー】</strong> ${menu} (${duration}分)</p>
            <p style="margin: 5px 0;"><strong>【料金】</strong> ¥${price.toLocaleString()}</p>
          </div>

          <p>当日のご来院を心よりお待ちしております。<br>ご予約の変更・キャンセルはお電話または公式LINEよりご連絡ください。</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">鍼灸整体院 琴</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"鍼灸整体院 琴" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '【鍼灸整体院 琴】ご予約完了のお知らせ',
        html: patientHtml,
      });
    }

    // --------------------------------------------------
    // 2. 院（管理者）用通知メール
    // --------------------------------------------------
    const adminEmails = [
      process.env.GMAIL_USER,
      'sinkyuseitaikoto@gmail.com'
    ].filter(Boolean);

    const adminHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
        <h2 style="color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 8px;">🔔 Web予約が入りました</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">お名前</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${name} 様</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">日時</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #d9534f; font-weight: bold;">${date} ${time}〜</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">メニュー</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${menu} (${duration}分)</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">料金</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">¥${price.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">電話番号</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${phone}">${phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">メールアドレス</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${email || '未入力'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">お悩み・症状</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${symptom || 'なし'}</td>
          </tr>
        </table>
      </div>
    `;

    await transporter.sendMail({
      from: `"予約通知システム" <${process.env.GMAIL_USER}>`,
      to: adminEmails.join(','),
      subject: `【新規予約】${name} 様 (${date} ${time})`,
      html: adminHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 });
  }
}
