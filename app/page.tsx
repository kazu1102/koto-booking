'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type Menu = { id: string; name: string; duration: number; price: number; description: string };
type Slot = { id: string; starts_at: string; ends_at: string };

const menus: Menu[] = [
  { id: 'first', name: '初診専用メニュー', duration: 60, price: 990, description: '初めてご来院の方・施術時間60分' },
  { id: 'symptom', name: '症状改善コース', duration: 30, price: 5000, description: '施術時間 30分' },
  { id: 'root', name: '根本改善コース', duration: 60, price: 10000, description: '施術時間 60分' }
];

const TOKYO = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
function tokyoDate(d = new Date()) { return TOKYO.format(d); }
function dateKey(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function monthTitle(y: number, m: number) { return `${y}年${m + 1}月`; }

export default function Home() {
  const today = tokyoDate();
  const [menu, setMenu] = useState(menus[0]);
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const calendarDays = useMemo(() => {
    const first = new Date(Date.UTC(month.year, month.month, 1));
    const offset = first.getUTCDay();
    const count = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [month]);

  const todayMonth = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1;
  const shownMonth = month.year * 12 + month.month;

  function changeMonth(delta: number) {
    const d = new Date(Date.UTC(month.year, month.month + delta, 1));
    setMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
  }

  function chooseDate(day: number) {
    const key = dateKey(month.year, month.month, day);
    if (key < today) return;
    setDate(key);
    setSlot('');
  }

  async function loadSlots() {
    setSlot('');
    const { data, error } = await supabase.rpc('available_slots', { p_date: date, p_duration: menu.duration });
    if (error) {
      setSlots([]);
      setNotice('エラー: ' + error.message);
      return;
    }
    const now = Date.now();
    const upcoming = (data || []).filter((s: Slot) => new Date(s.starts_at).getTime() > now);
    setSlots(upcoming);
    setNotice('');
  }

  useEffect(() => {
    loadSlots();
  }, [date, menu]);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setNotice('');
    if (!slot) {
      setNotice('空き時間を選択してください。');
      return;
    }
    const chosen = slots.find((s) => s.id === slot);
    if (!chosen || new Date(chosen.starts_at).getTime() <= Date.now()) {
      setNotice('その時間は選択できません。最新の空き時間を選んでください。');
      await loadSlots();
      return;
    }
    setBusy(true);

    // 1. Supabaseへ予約登録
    const { data, error } = await supabase.rpc('book_appointment', {
      p_slot_id: slot,
      p_menu_id: menu.id,
      p_customer_name: name,
      p_phone: phone,
      p_email: email ? email.trim() : null,
    });

    if (error) {
      console.error('Supabase予約エラー:', error);
      setNotice(
        error.message.includes('SLOT_TAKEN')
          ? 'その時間は予約済みです。別の時間を選んでください。'
          : '予約に失敗しました。時間を置いて再度お試しください。'
      );
      setBusy(false);
      return;
    }

    // 2. 通知API呼び出し
    let mailSent = false;
    try {
      const mailRes = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu: menu.name,
          price: menu.price,
          duration: menu.duration,
          date,
          time: new Date(chosen.starts_at).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo',
          }),
          name,
          phone,
          email: email ? email.trim() : '',
        }),
      });
      mailSent = mailRes.ok;
      if (!mailRes.ok) {
        console.error('通知APIレスポンスエラー:', await mailRes.text());
      }
    } catch (e) {
      console.error('通知API送信失敗:', e);
    }

    setNotice(
      mailSent
        ? 'ご予約を受け付けました。院への予約通知メールも送信しました。'
        : 'ご予約を受け付けました。予約通知メールは未設定または送信できていません。院で予約一覧をご確認ください。'
    );
    setSlot('');
    setName('');
    setPhone('');
    setEmail('');
    setBusy(false);
    await loadSlots();
  }

  return (
    <main className="wrap">
      <header>
        <div className="logo">
          鍼灸整体院 琴<span>KOTO ACUPUNCTURE & BODY CARE</span>
        </div>
        <div className="hours">毎日 10:00–20:00</div>
      </header>

      <section className="hero">
        <small>ONLINE RESERVATION</small>
        <h1>
          心と身体に、
          <br />
          丁寧なケアを。
        </h1>
        <p>ご希望のメニューと日時を選択してご予約ください。</p>
      </section>

      <section className="card">
        <h2>
          <i>01</i> メニューを選択
        </h2>
        <div className="menus">
          {menus.map((m) => (
            <button
              type="button"
              key={m.id}
              className={'menu ' + (menu.id === m.id ? 'chosen' : '')}
              onClick={() => setMenu(m)}
            >
              <b>{m.name}</b>
              <span>{m.description}</span>
              <strong>¥{m.price.toLocaleString()}</strong>
              <small>{m.duration}分</small>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>
          <i>02</i> 日時を選択
        </h2>
        <div className="calendar">
          <div className="calendar-head">
            <button type="button" aria-label="前の月" disabled={shownMonth <= todayMonth} onClick={() => changeMonth(-1)}>
              ‹
            </button>
            <strong>{monthTitle(month.year, month.month)}</strong>
            <button type="button" aria-label="次の月" onClick={() => changeMonth(1)}>
              ›
            </button>
          </div>
          <div className="weekdays">
            {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
              <span key={d} className={i === 0 ? 'sun' : i === 6 ? 'sat' : ''}>
                {d}
              </span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((day, i) =>
              day === null ? (
                <span key={'blank' + i} />
              ) : (
                <button
                  type="button"
                  key={day}
                  disabled={dateKey(month.year, month.month, day) < today}
                  className={`${date === dateKey(month.year, month.month, day) ? 'selected' : ''} ${
                    dateKey(month.year, month.month, day) === today ? 'today' : ''
                  }`}
                  onClick={() => chooseDate(day)}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>
        <p className="selected-date">
          選択日：<strong>{date.replaceAll('-', '/')}</strong>
        </p>
        <h3 className="slot-title">空いている時間</h3>
        <div className="slots">
          {slots.map((s) => (
            <button
              type="button"
              key={s.id}
              className={'time ' + (slot === s.id ? 'chosen' : '')}
              onClick={() => setSlot(s.id)}
            >
              {new Date(s.starts_at).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Tokyo',
              })}
            </button>
          ))}
        </div>
        {slots.length === 0 && <p className="muted">選択日の空き枠はありません。別の日付を選択してください。</p>}
      </section>

      <section className="card">
        <h2>
          <i>03</i> お客様情報
        </h2>
        <form onSubmit={book}>
          <label>
            お名前
            <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="例：琴 花子" />
          </label>
          <label>
            電話番号
            <input required maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="例：09012345678" />
          </label>
          <label>
            メールアドレス（任意）
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="確認用メールアドレス" />
          </label>
          <button className="primary" type="submit" disabled={busy}>
            {busy ? '予約処理中…' : '予約を確定する'}
          </button>
        </form>
        {notice && <p className="notice">{notice}</p>}
        <p className="muted">送信いただいた情報は予約対応のために利用します。</p>
      </section>
      <footer>© 鍼灸整体院 琴</footer>
    </main>
  );
}