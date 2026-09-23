create or replace function public.create_workspace_with_owner(
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

  insert into public.activity (workspace_id, actor_id, event_type)
  values (new_workspace.id, p_owner_id, 'workspace_created');

  return new_workspace;
end;
$$;

revoke execute on function public.create_workspace_with_owner(text, uuid) from public;
grant execute on function public.create_workspace_with_owner(text, uuid) to service_role;


create or replace function public.accept_invitation(
  p_invitation_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_invitation public.invitations;
  v_user_email text;
  v_workspace public.workspaces;
begin
  select * into v_invitation
  from public.invitations
  where id = p_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found' using errcode = 'APP04';
  end if;

  select email into v_user_email
  from public.users
  where id = p_user_id;

  if lower(v_user_email) is distinct from lower(v_invitation.invited_email) then
    raise exception 'Invitation not found' using errcode = 'APP04';
  end if;

  if v_invitation.status = 'pending' and v_invitation.expires_at < now() then
    update public.invitations set status = 'expired' where id = p_invitation_id;
    return jsonb_build_object('status', 'expired');
  end if;

  if v_invitation.status != 'pending' then
    raise exception 'This invitation is no longer pending' using errcode = 'APP01';
  end if;

  if exists (
    select 1 from public.workspace_members
    where workspace_id = v_invitation.workspace_id
      and user_id = p_user_id
  ) then
    raise exception 'You are already a member of this workspace' using errcode = 'APP03';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invitation.workspace_id, p_user_id, 'member');

  insert into public.activity (workspace_id, actor_id, event_type, target_id)
  values (v_invitation.workspace_id, p_user_id, 'member_joined', p_user_id);

  update public.invitations set status = 'accepted' where id = p_invitation_id;

  select * into v_workspace
  from public.workspaces
  where id = v_invitation.workspace_id;

  return jsonb_build_object('status', 'success', 'workspace', to_jsonb(v_workspace));
end;
$$;

revoke execute on function public.accept_invitation(uuid, uuid) from public;
grant execute on function public.accept_invitation(uuid, uuid) to service_role;