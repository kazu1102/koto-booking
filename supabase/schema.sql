-- Run this entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.menus (
 id text primary key, name text not null, duration integer not null check(duration>0),
 price integer not null check(price>=0), active boolean not null default true
);
insert into public.menus(id,name,duration,price) values
 ('first','初診',60,990),('symptom','症状改善コース',30,5000),('root','根本改善コース',60,10000)
on conflict(id) do update set name=excluded.name,duration=excluded.duration,price=excluded.price;
create table if not exists public.business_hours (
 weekday integer primary key check(weekday between 0 and 6),
 opens time not null default '10:00', closes time not null default '20:00', closed boolean not null default false
);
insert into public.business_hours(weekday,opens,closes,closed) values
 (0,'10:00','20:00',false),(1,'10:00','20:00',false),(2,'10:00','20:00',false),
 (3,'10:00','20:00',false),(4,'10:00','20:00',false),(5,'10:00','20:00',false),(6,'10:00','20:00',false)
on conflict(weekday) do nothing;
create table if not exists public.closures(day date primary key, reason text);
create table if not exists public.appointments (
 id uuid primary key default gen_random_uuid(),
 starts_at timestamptz not null, ends_at timestamptz not null,
 menu_id text not null references public.menus(id), customer_name text not null,
 phone text not null, email text, status text not null default 'booked' check(status in ('booked','cancelled')),
 created_at timestamptz not null default now(), check(ends_at>starts_at)
);
create index if not exists appointments_starts_at_idx on public.appointments(starts_at);
alter table public.menus enable row level security;
alter table public.business_hours enable row level security;
alter table public.closures enable row level security;
alter table public.appointments enable row level security;
create policy "public read active menus" on public.menus for select to anon,authenticated using(active=true);
create policy "public read hours" on public.business_hours for select to anon,authenticated using(true);
create policy "public read closures" on public.closures for select to anon,authenticated using(true);
-- Appointment table has no direct public policies. All booking operations go through SECURITY DEFINER RPC.
create or replace function public.available_slots(p_date date,p_duration integer)
returns table(id text,starts_at timestamptz,ends_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare t timestamp; close_t timestamp; day_open timestamp;
begin
 if p_date < current_date then return; end if;
 if exists(select 1 from closures c where c.day=p_date) then return; end if;
 select (p_date+opens)::timestamp,(p_date+closes)::timestamp into day_open,close_t
 from business_hours where weekday=extract(dow from p_date)::int and not closed;
 if day_open is null then return; end if;
 t:=day_open;
 while t + make_interval(mins=>p_duration) <= close_t loop
  if t > (now() at time zone 'Asia/Tokyo') and not exists(
   select 1 from appointments a where a.status='booked'
   and a.starts_at < (t+make_interval(mins=>p_duration)) at time zone 'Asia/Tokyo'
   and a.ends_at > t at time zone 'Asia/Tokyo'
  ) then
   id:=to_char(t,'YYYY-MM-DD"T"HH24:MI'); starts_at:=t at time zone 'Asia/Tokyo';
   ends_at:=(t+make_interval(mins=>p_duration)) at time zone 'Asia/Tokyo'; return next;
  end if;
  t:=t+interval '30 minutes';
 end loop;
end $$;
create or replace function public.book_appointment(p_slot_id text,p_menu_id text,p_customer_name text,p_phone text,p_email text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare start_local timestamp; dur int; price_value int; new_id uuid; start_utc timestamptz; end_utc timestamptz;
begin
 select duration into dur from menus where id=p_menu_id and active=true;
 if dur is null then raise exception 'INVALID_MENU'; end if;
 start_local:=to_timestamp(p_slot_id,'YYYY-MM-DD"T"HH24:MI')::timestamp;
 start_utc:=start_local at time zone 'Asia/Tokyo'; end_utc:=(start_local+make_interval(mins=>dur)) at time zone 'Asia/Tokyo';
 perform pg_advisory_xact_lock(hashtext(p_slot_id));
 if exists(select 1 from appointments a where a.status='booked' and a.starts_at<end_utc and a.ends_at>start_utc) then raise exception 'SLOT_TAKEN'; end if;
 insert into appointments(starts_at,ends_at,menu_id,customer_name,phone,email)
 values(start_utc,end_utc,p_menu_id,left(trim(p_customer_name),80),left(trim(p_phone),30),nullif(left(trim(coalesce(p_email,'')),120),''))
 returning id into new_id;
 return new_id;
end $$;
grant execute on function public.available_slots(date,integer) to anon,authenticated;
grant execute on function public.book_appointment(text,text,text,text,text) to anon,authenticated;
