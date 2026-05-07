-- DecorGenie AI — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'business')),
  designs_used_this_month integer default 0,
  designs_reset_at timestamptz default date_trunc('month', now()) + interval '1 month',
  created_at timestamptz default now()
);

-- Designs table
create table public.designs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  style text not null,
  room_type text not null,
  budget text not null,
  room_size integer,
  notes text,
  original_image_url text,
  generated_image_url text,
  design_data jsonb not null,   -- Full AI response JSON
  is_public boolean default false,
  share_token text unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz default now()
);

-- Saved items / wishlist
create table public.saved_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  design_id uuid references public.designs(id) on delete cascade,
  item_name text,
  item_price text,
  item_store text,
  item_url text,
  created_at timestamptz default now()
);

-- Usage tracking
create table public.usage_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  action text,           -- 'generate_design', 'generate_image', 'export_pdf'
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.designs enable row level security;
alter table public.saved_items enable row level security;
alter table public.usage_logs enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Designs: users see own + public designs
create policy "Users can view own designs" on public.designs for select using (auth.uid() = user_id or is_public = true);
create policy "Users can insert own designs" on public.designs for insert with check (auth.uid() = user_id);
create policy "Users can update own designs" on public.designs for update using (auth.uid() = user_id);
create policy "Users can delete own designs" on public.designs for delete using (auth.uid() = user_id);

-- Saved items
create policy "Users can manage own saved items" on public.saved_items for all using (auth.uid() = user_id);

-- Usage logs
create policy "Users can view own usage" on public.usage_logs for select using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for room images (run in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('room-images', 'room-images', true);
