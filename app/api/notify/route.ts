import {NextResponse} from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BOOKING_NOTIFICATION_EMAILS;
  if (!apiKey || !to) {
    return NextResponse.json({ok:false,message:'メール通知の設定が未完了です。'}, {status:503});
  }
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ok:false}, {status:400}); }
  const {menu,price,duration,date,time,name,phone,email} = body ?? {};
  if (![menu,date,time,name,phone].every((v)=>typeof v==='string' && v.trim()) || typeof price!=='number' || typeof duration!=='number') {
    return NextResponse.json({ok:false}, {status:400});
  }
  const recipients = to.split(',').map(s=>s.trim()).filter(Boolean);
  const text = `鍼灸整体院 琴に新しい予約が入りました。\n\n日時：${date} ${time}\nメニュー：${menu}\n施術時間：${duration}分\n料金：¥${price.toLocaleString('ja-JP')}\nお名前：${name}\n電話番号：${phone}\nメールアドレス：${email || '未入力'}\n\nSupabaseの予約管理画面でも予約内容を確認してください。`;
  const result = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({from:'鍼灸整体院 琴 予約通知 <onboarding@resend.dev>',to:recipients,subject:`【琴】新しい予約：${date} ${time} ${name}様`,text})
  });
  if (!result.ok) {
    const details = await result.text();
    console.error('Resend email error:', details);
    return NextResponse.json({ok:false,message:'メール送信に失敗しました。'}, {status:502});
  }
  return NextResponse.json({ok:true});
}
