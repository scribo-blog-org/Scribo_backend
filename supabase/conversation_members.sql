-- Chat channel: uchat_{mongoUserId}_{conversationId}  (no extra colons)

drop policy if exists "Conversation members can read chat broadcasts" on realtime.messages;
drop policy if exists "debug chat only" on realtime.messages;
drop policy if exists "allow reading own chat channel" on realtime.messages;
drop policy if exists "allow reading own user chat channel" on realtime.messages;

create policy "allow reading own user chat channel"
    on realtime.messages
    for select
    to public
    using (
        split_part((select realtime.topic()), '_', 1) = 'uchat'
        and split_part((select realtime.topic()), '_', 2) = coalesce(
            (select auth.jwt() ->> 'id'),
            (select auth.jwt() ->> 'sub')
        )
    );

-- User notifications / unread: user:{mongoUserId}
drop policy if exists "allow reading own user channel" on realtime.messages;

create policy "allow reading own user channel"
    on realtime.messages
    for select
    to public
    using (
        split_part((select realtime.topic()), ':', 1) = 'user'
        and split_part((select realtime.topic()), ':', 2) = coalesce(
            (select auth.jwt() ->> 'id'),
            (select auth.jwt() ->> 'sub')
        )
    );
