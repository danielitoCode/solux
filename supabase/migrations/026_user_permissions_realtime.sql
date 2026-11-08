-- Permite que el cliente reciba cambios de permisos sin re-login.
do $$
begin
  alter publication supabase_realtime add table public.user_permissions;
exception
  when duplicate_object then null;
  when undefined_object then null;
  when others then
    -- En algunos proyectos la publicación o la tabla ya está añadida
    raise notice 'realtime user_permissions: %', sqlerrm;
end;
$$;
