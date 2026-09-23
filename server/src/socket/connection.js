import { getMembership } from "../services/workspace.service.js";
import {
  addConnection,
  removeConnection,
  getOnlineUsers,
} from "../services/presence.service.js";
import { createMessage } from "../services/chat.service.js";
import { applyOperation } from "../services/whiteboard.service.js";

export function registerConnectionHandler(io) {
  io.on("connection", (socket) => {
    socket.joinedWorkspaces = new Set();

    if (socket.recovered) {
      (async () => {
        for (const room of socket.rooms) {
          if (room.startsWith("workspace:")) {
            const workspaceId = room.slice("workspace:".length);
            socket.joinedWorkspaces.add(workspaceId);

            try {
              const isFirstConnection = await addConnection(
                workspaceId,
                socket.user.id,
              );
              if (isFirstConnection) {
                socket.to(`workspace:${workspaceId}`).emit("user_online", {
                  id: socket.user.id,
                  email: socket.user.email,
                });
              }
            } catch (err) {
              console.error(
                "Failed to reconcile presence after recovery for workspace",
                workspaceId,
                err,
              );
            }
          }
        }
      })();
    }

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

    socket.on("chat:message", async (workspaceId, content, callback) => {
      try {
        const membership = await getMembership(workspaceId, socket.user.id);

        if (!membership) {
          return callback?.({ success: false, error: "Workspace not found" });
        }

        const message = await createMessage(
          workspaceId,
          socket.user.id,
          content,
        );

        callback?.({ success: true, data: message });

        socket.to(`workspace:${workspaceId}`).emit("chat:message", {
          ...message,
          sender_email: socket.user.email,
        });
      } catch (err) {
        console.error("chat:message failed:", err);
        callback?.({
          success: false,
          error: "Something went wrong. Please try again.",
        });
      }
    });

    socket.on(
      "whiteboard:operation",
      async (workspaceId, objectId, action, data, callback) => {
        try {
          const membership = await getMembership(workspaceId, socket.user.id);

          if (!membership) {
            return callback?.({ success: false, error: "Workspace not found" });
          }

          await applyOperation(workspaceId, objectId, action, data);

          callback?.({ success: true });

          socket.to(`workspace:${workspaceId}`).emit("whiteboard:operation", {
            objectId,
            action,
            data,
          });
        } catch (err) {
          console.error("whiteboard:operation failed:", err);
          callback?.({
            success: false,
            error: err.isOperational
              ? err.message
              : "Failed to apply whiteboard operation. Please try again.",
          });
        }
      },
    );

    socket.on("workspace:leave", async (workspaceId) => {
      if (!socket.joinedWorkspaces.has(workspaceId)) return;

      socket.leave(`workspace:${workspaceId}`);
      socket.joinedWorkspaces.delete(workspaceId);

      const wasLastConnection = await removeConnection(
        workspaceId,
        socket.user.id,
      );
      if (wasLastConnection) {
        socket.to(`workspace:${workspaceId}`).emit("user_offline", {
          id: socket.user.id,
          email: socket.user.email,
        });
      }
    });

    socket.on("whiteboard:cursor", (workspaceId, position) => {
      if (!socket.joinedWorkspaces.has(workspaceId)) {
        return; // silently ignore -- not a member of this room, no ack to send anyway
      }

      socket.to(`workspace:${workspaceId}`).emit("whiteboard:cursor", {
        id: socket.user.id,
        email: socket.user.email,
        position,
      });
    });
  });
}
