create function public.create_workspace_with_owner(
  p_name text,
  p_owner_id uuid
)
returns public.workspaces
language plpgsql
set search_path = ''
as $$
declare
  new_workspace public.workspaces;
begin
  insert into public.workspaces (name, owner_id)
  values (p_name, p_owner_id)
  returning * into new_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace.id, p_owner_id, 'owner');

  insert into public.whiteboards (workspace_id)
  values (new_workspace.id);

  return new_workspace;
end;
$$;

revoke execute
  on function public.create_workspace_with_owner(text, uuid)
  from public;

grant execute
  on function public.create_workspace_with_owner(text, uuid)
  to service_role;