-- ACE El Dorado — ejecutar en SQL Editor de Supabase UNA SOLA VEZ.
create extension if not exists pgcrypto;
create table if not exists public.categories (id uuid primary key default gen_random_uuid(),name text not null unique,sort_order integer not null default 0,created_at timestamptz not null default now());
create table if not exists public.businesses (id uuid primary key default gen_random_uuid(),name text not null check(length(trim(name)) between 2 and 160),category text not null,city text not null default 'Virtual',address text,description text,image_url text,whatsapp text not null,instagram text,facebook text,website text,owner_name text,private_support_request text,featured boolean not null default false,status text not null default 'pending' check(status in ('pending','approved','rejected')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade,role text not null check(role in ('admin','superadmin')),created_at timestamptz not null default now());
create or replace function public.is_ace_admin() returns boolean language sql stable security definer set search_path = '' as $$select exists(select 1 from public.admin_users where user_id=auth.uid())$$;
create or replace function public.is_ace_superadmin() returns boolean language sql stable security definer set search_path = '' as $$select exists(select 1 from public.admin_users where user_id=auth.uid() and role='superadmin')$$;
revoke all on function public.is_ace_admin() from public;grant execute on function public.is_ace_admin() to authenticated;
revoke all on function public.is_ace_superadmin() from public;grant execute on function public.is_ace_superadmin() to authenticated;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.admin_users enable row level security;
create policy "categories public read" on public.categories for select to anon,authenticated using (true);
create policy "categories admins insert" on public.categories for insert to authenticated with check (public.is_ace_admin());
create policy "categories admins update" on public.categories for update to authenticated using (public.is_ace_admin()) with check (public.is_ace_admin());
create policy "businesses anon read approved" on public.businesses for select to anon using (status='approved');
create policy "businesses admin read" on public.businesses for select to authenticated using (public.is_ace_admin());
create policy "businesses anonymous submit" on public.businesses for insert to anon with check(status='pending' and featured=false);
create policy "businesses admins insert" on public.businesses for insert to authenticated with check(public.is_ace_admin());
create policy "businesses admins update" on public.businesses for update to authenticated using(public.is_ace_admin()) with check(public.is_ace_admin());
create policy "admin users own role" on public.admin_users for select to authenticated using(user_id=auth.uid() or public.is_ace_superadmin());
-- Crucial: public clients can never read private_support_request or owner_name, even for approved businesses.
revoke all on public.businesses from anon,authenticated;
grant select(id,name,category,city,address,description,image_url,whatsapp,instagram,facebook,website,featured,status,created_at) on public.businesses to anon;
grant insert(name,category,city,address,description,image_url,whatsapp,instagram,facebook,website,owner_name,private_support_request) on public.businesses to anon;
grant select,insert,update on public.businesses to authenticated;
grant select on public.categories to anon,authenticated;
grant insert,update on public.categories to authenticated;
grant select on public.admin_users to authenticated;
-- Restrict role assignment to an authenticated superadmin; never expose service_role to browser.
create or replace function public.grant_admin_by_email(target_email text,target_role text) returns void language plpgsql security definer set search_path = '' as $$
declare target_id uuid;
begin
 if not public.is_ace_superadmin() then raise exception 'No autorizado';end if;
 if target_role not in ('admin','superadmin') then raise exception 'Rol inválido';end if;
 select id into target_id from auth.users where lower(email)=lower(trim(target_email)) limit 1;
 if target_id is null then raise exception 'La cuenta aún no existe en Supabase Auth';end if;
 insert into public.admin_users(user_id,role) values(target_id,target_role) on conflict(user_id) do update set role=excluded.role;
end;$$;
revoke all on function public.grant_admin_by_email(text,text) from public;grant execute on function public.grant_admin_by_email(text,text) to authenticated;
-- Categorías iniciales
insert into public.categories(name,sort_order) values
('Alimentos y bebidas',0),('Moda y accesorios',1),('Belleza y cuidado personal',2),('Artesanías y regalos',3),('Hogar y decoración',4),('Tecnología',5),('Educación',6),('Salud y bienestar',7),('Servicios profesionales',8),('Agricultura y productos naturales',9),('Turismo y entretenimiento',10),('Otros',11)
on conflict(name) do nothing;
-- Logos públicos (no subir datos personales sensibles). Límite de 5 MB y tipos MIME configurar también en dashboard de Storage.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('business-logos','business-logos',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "business logos public read" on storage.objects for select to anon,authenticated using(bucket_id='business-logos');
create policy "business logos uploads" on storage.objects for insert to anon,authenticated with check(bucket_id='business-logos' and (auth.role()='anon' or public.is_ace_admin()));
-- DESPUÉS de crear la cuenta de la persona superadministradora en Supabase Authentication:
-- insert into public.admin_users(user_id,role) select id,'superadmin' from auth.users where email='TU_EMAIL_REAL' on conflict(user_id) do update set role='superadmin';
