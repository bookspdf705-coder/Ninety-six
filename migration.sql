-- Photos table
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  url text not null,
  name text,
  caption text,
  uploaded_at timestamptz not null default now()
);

-- Comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  author text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_photo_id_idx on public.comments(photo_id);

-- Enable RLS
alter table public.photos enable row level security;
alter table public.comments enable row level security;

-- Public read/insert policies — this site has no accounts, anyone can
-- view or add a photo or comment.
create policy "Public can view photos" on public.photos
  for select using (true);
create policy "Public can add photos" on public.photos
  for insert with check (true);

create policy "Public can view comments" on public.comments
  for select using (true);
create policy "Public can add comments" on public.comments
  for insert with check (true);

-- Storage bucket for the actual media files (photos and videos)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Storage policies: public can read and upload into the photos bucket
create policy "Public can view photo files" on storage.objects
  for select using (bucket_id = 'photos');
create policy "Public can upload photo files" on storage.objects
  for insert with check (bucket_id = 'photos');

-- ============================================================
-- Follow-up migration: Public / Private wall sections
-- ============================================================
alter table public.photos
  add column if not exists visibility text not null default 'private'
  check (visibility in ('public', 'private'));

update public.photos set visibility = 'private' where visibility is null;

-- ============================================================
-- Follow-up migration: video support
-- ============================================================
-- Everything uploaded before videos existed is a photo.
alter table public.photos
  add column if not exists media_type text not null default 'image'
  check (media_type in ('image', 'video'));

update public.photos set media_type = 'image' where media_type is null;

-- Per-file size cap on the bucket: 50MB (Supabase free-tier ceiling).
update storage.buckets set file_size_limit = 52428800 where id = 'photos';
