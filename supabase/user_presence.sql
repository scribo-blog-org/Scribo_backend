create table if not exists public.user_presence (
    user_id text not null,
    connection_id text not null,
    connected_at timestamptz not null default now(),
    primary key (user_id, connection_id)
);

create index if not exists user_presence_user_id_idx
    on public.user_presence (user_id);

alter table public.user_presence enable row level security;

drop policy if exists "Users manage own presence rows" on public.user_presence;
drop policy if exists "Anyone can read user presence" on public.user_presence;

create policy "Users manage own presence rows"
    on public.user_presence
    for all
    to authenticated
    using (
        user_id = coalesce(
            (select auth.jwt() ->> 'id'),
            (select auth.jwt() ->> 'sub')
        )
    )
    with check (
        user_id = coalesce(
            (select auth.jwt() ->> 'id'),
            (select auth.jwt() ->> 'sub')
        )
    );

create policy "Anyone can read user presence"
    on public.user_presence
    for select
    to public
    using (true);

do $$
begin
    alter publication supabase_realtime add table public.user_presence;
exception
    when duplicate_object then null;
end $$;
