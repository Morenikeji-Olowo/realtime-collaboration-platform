import { AppError } from "../middleware/error.js";
import supabase from "../config/supabase.js";
import { getMembership } from "./workspace.service.js";

export async function createDocument(workspaceId, userId, title) {
  const membership = await getMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: workspaceId,
      creator_id: userId,
      title,
    })
    .select()
    .single();

  if (error) {
    throw new AppError("Failed to create document", 400, { cause: error });
  }

  return data;
}

export async function listDocuments(workspaceId, userId) {
  const membership = await getMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Failed to list documents", 500);
  }

  return data;
}

export async function getDocumentById(documentId, userId) {
  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (error) {
    throw new AppError("Document not found", 404);
  }

  const membership = await getMembership(document.workspace_id, userId);

  if (!membership) {
    throw new AppError("Document not found", 404);
  }

  return document;
}

export async function renameDocument(documentId, userId, newTitle) {
  const document = await getDocumentById(documentId, userId);

  const { data, error } = await supabase
    .from("documents")
    .update({ title: newTitle })
    .eq("id", documentId)
    .select()
    .single();

  if (error) {
    throw new AppError("Failed to rename document", 400, { cause: error });
  }

  return data;
}

export async function deleteDocument(documentId, userId) {
  await getDocumentById(documentId, userId);

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) {
    throw new AppError("Failed to delete document", 500);
  }
}
