import { getMembership } from "../services/workspace.service.js";
import {
  addConnection,
  removeConnection,
  getOnlineUsers,
} from "../services/presence.service.js";
import { createMessage } from '../services/chat.service.js';

export function registerConnectionHandler(io) {
  io.on("connection", (socket) => {
    socket.joinedWorkspaces = new Set();

    socket.on("workspace:join", async (workspaceId, callback) => {
      try {
        const membership = await getMembership(workspaceId, socket.user.id);

        if (!membership) {
          return callback?.({ success: false, error: "Workspace not found" });
        }

        if (!socket.joinedWorkspaces.has(workspaceId)) {
          const isFirstConnection = await addConnection(
            workspaceId,
            socket.user.id,
          );
          socket.join(`workspace:${workspaceId}`);
          socket.joinedWorkspaces.add(workspaceId);


          if (isFirstConnection) {
            
            socket.to(`workspace:${workspaceId}`).emit("user_online", {
              id: socket.user.id,
              email: socket.user.email,
            });
          }
        }

        const onlineUsers = await getOnlineUsers(workspaceId);
        callback?.({ success: true, onlineUsers });
      } catch (err) {
        console.error("workspace:join failed:", err);
        callback?.({
          success: false,
          error: "Something went wrong. Please try again.",
        });
      }
    });

    socket.on("disconnect", async () => {
      for (const workspaceId of socket.joinedWorkspaces) {
        try {
          const wasLastConnection = await removeConnection(
            workspaceId,
            socket.user.id,
          );
        
          if (wasLastConnection) {
            console.log(
              "DEBUG emitting user_offline to room:",
              `workspace:${workspaceId}`,
            );
            socket.to(`workspace:${workspaceId}`).emit("user_offline", {
              id: socket.user.id,
              email: socket.user.email,
            });
          }
        } catch (err) {
          console.error(
            "Presence cleanup failed for workspace",
            workspaceId,
            err,
          );
        }
      }
    });

    socket.on('chat:message', async (workspaceId, content, callback) => {
      try{
        const membership = await getMembership(workspaceId, socket.user.id);
        if (!membership) {
          return callback?.({ success: false, error: "Workspace not found" });
        }
        const message = await createMessage(workspaceId, socket.user.id, content);
        socket.to(`workspace:${workspaceId}`).emit('chat:message', {
          ...message,
          sender_email: socket.user.email,
        });
      }
      catch(err){
        callback?.({
          success: false,
          error: 'Something went wrong. Please try again.',
        })
      }
    })
  });
}
