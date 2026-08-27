import { AppError } from "../middleware/error.js";
import supabase from "../config/supabase.js";

export async function getMembership(workspaceId, userId) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to check workspace membership", 500, {cause: error});
  }
  return data;
}

// confirm later
export async function createWorkspace(name, ownerId) {
  const { data, error } = await supabase.rpc("create_workspace_with_owner", {
    p_name: name,
    p_owner_id: ownerId,
  });

  if (error) {
    throw new AppError("Failed to create workspace. Please try again.", 400, {
      cause: error,
    });
  }

  return data;
}

export async function listWorkspaces(userId) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(*)")
    .eq("user_id", userId);

  if (error) {
    throw new AppError("Failed to list workspaces", 500);
  }

  return data.map((row) => ({
    ...row.workspaces,
    role: row.role,
  }));
}

export async function getWorkspaceById(workspaceId, userId) {
  const membership = await getMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (error) {
    throw new AppError("Failed to get workspace", 500);
  }

  return { ...data, role: membership.role };
}

//owner
export async function renameWorkspace(workspaceId, userId, newName) {
  const membership = await getMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }

  if (membership.role !== "owner") {
    throw new AppError(
      "Only the workspace owner can rename this workspace",
      403,
    );
  }

  const { data, error } = await supabase
    .from("workspaces")
    .update({ name: newName })
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) {
    throw new AppError("Failed to rename workspace", 400);
  }

  return { ...data, role: membership.role };
}

export async function deleteWorkspace(workspaceId, userId) {
  const membership = await getMembership(workspaceId, userId);
  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }

  if (membership.role !== "owner") {
    throw new AppError(
      "Only the workspace owner can delete this workspace",
      403,
    );
  }
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) {
    throw new AppError("Failed to delete workspace", 500);
  }
}
