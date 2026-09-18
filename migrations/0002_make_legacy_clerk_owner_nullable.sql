do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'venues'
      and column_name = 'owner_clerk_user_id'
  ) then
    update venues
    set owner_user_id = owner_clerk_user_id
    where owner_user_id is null
      and owner_clerk_user_id is not null;

    alter table venues
    alter column owner_clerk_user_id drop not null;
  end if;
end $$;
