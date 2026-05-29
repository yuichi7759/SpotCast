-- Enable pgvector
create extension if not exists vector;

-- Users table (plan management)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Documents table for RAG
create table if not exists public.documents (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  embedding vector(1024),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Index for fast similarity search
create index if not exists documents_embedding_idx
  on public.documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RLS
alter table public.users enable row level security;
alter table public.documents enable row level security;

create policy "Users can read own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);
create policy "Users can read own documents" on public.documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can delete own documents" on public.documents for delete using (auth.uid() = user_id);

-- RAG search function (takes pre-computed embedding from server)
create or replace function match_documents_by_vector(
  query_embedding vector(1024),
  match_count int default 5
)
returns table (content text, metadata jsonb, similarity float)
language sql as $$
  select d.content, d.metadata,
         1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.user_id = auth.uid()
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- Support messages
create table if not exists public.support_messages (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz default now()
);
alter table public.support_messages enable row level security;
create policy "Users can insert own support messages" on public.support_messages
  for insert with check (auth.uid() = user_id);
create policy "Users can read own support messages" on public.support_messages
  for select using (auth.uid() = user_id);
