drop policy if exists "allow reading own user chat channel" on realtime.messages;
drop policy if exists "allow reading own chat channel" on realtime.messages;
drop policy if exists "Conversation members can read chat broadcasts" on realtime.messages;
drop policy if exists "debug chat only" on realtime.messages;

create policy "allow reading own conversation channel"
    on realtime.messages
    for select
    to public
    using (
        split_part((select realtime.topic()), ':', 1) = 'chat'
        and exists (
            select 1
            from conversation_members cm
            where cm.conversation_id = split_part((select realtime.topic()), ':', 2)
              and cm.user_id = coalesce(
                  (select auth.jwt() ->> 'id'),
                  (select auth.jwt() ->> 'sub')
              )
        )
    );