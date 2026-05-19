create extension if not exists pgcrypto;

create table if not exists public.audit_results (
  id uuid primary key default gen_random_uuid(),
  wallet_address text,
  contract_name text not null,
  model text not null check (model in ('graph', 'sequential')),
  trust_score numeric not null default 0,
  critical_vulns integer not null default 0,
  fraud_risk text not null default 'Low',
  gas_efficiency numeric not null default 0,
  status text not null default 'completed' check (status in ('completed', 'failed')),
  source_code text,
  created_at timestamptz not null default now()
);

alter table public.audit_results
  add column if not exists wallet_address text;

alter table public.audit_results
  add column if not exists source_code text;

create index if not exists audit_results_wallet_created_idx
  on public.audit_results (wallet_address, created_at desc);

create index if not exists audit_results_created_idx
  on public.audit_results (created_at desc);

alter table public.audit_results enable row level security;

drop policy if exists "public read audit_results" on public.audit_results;
create policy "public read audit_results"
  on public.audit_results
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public insert audit_results" on public.audit_results;
create policy "public insert audit_results"
  on public.audit_results
  for insert
  to anon, authenticated
  with check (true);
