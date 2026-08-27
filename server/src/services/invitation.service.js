import supabase from "../config/supabase.js";
import { AppError } from "../middleware/error.js";
import { getMembership } from "./workspace.service.js";

export async function createInvitation(workspaceId, inviterId, invitedEmail) {
  const membership = await getMembership(workspaceId, inviterId);

  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }

  if (membership.role !== "owner") {
    throw new AppError("Only the workspace owner can invite users", 403);
  }

  const normalizedEmail = invitedEmail.toLowerCase();

  const { data: existingUser, error: userLookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (userLookupError) {
    throw new AppError("Failed to create invitation", 500);
  }
  if (existingUser) {
    const existingMembership = await getMembership(
      workspaceId,
      existingUser.id,
    );

    if (existingMembership) {
      throw new AppError("User is already a member of this workspace", 409);
    }
  }

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      workspace_id: workspaceId,
      inviter_id: inviterId,
      invited_email: normalizedEmail,
      invited_user_id: existingUser?.id ?? null,
      expires_at: expiresAt,
    })

    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError(
        "An invitation is already pending for this email",
        409,
      );
    }
    throw new AppError("Failed to create invitation", 500, { cause: error });
  }

  return data;
}

export async function rejectInvitation(invitationId, userEmail) {
  const { data, error } = await supabase
    .from("invitations")
    .update({
      status: "rejected",
    })
    .eq("id", invitationId)
    .eq("invited_email", userEmail.toLowerCase())
    .eq("status", "pending")
    .select()
    .single();

  if (error) {
    throw new AppError("Invitation not found", 404);
  }
  return data;
}

export async function acceptInvitation(invitationId, userId) {
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_invitation_id: invitationId,
    p_user_id: userId,
  });

  if(error){
    if(error.code === 'APP04'){
        throw new AppError('Invitation not found', 404);
    }
    if(error.code === 'APP01'){
        throw new AppError('This invitation is no longer pending', 400);
    }
    if(error.code === 'APP03'){
        throw new AppError('You are already a member of this workspace', 409);
    }
    throw new AppError('Failed to accept invitation', 500, { cause: error });   
  }

  if(data.status === 'expired'){
    throw new AppError('This invitation has expired', 400);
  }

  return data.workspace;
}
