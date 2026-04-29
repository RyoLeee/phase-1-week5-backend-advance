import Elysia from "elysia";
import { messageService } from "../services/message.service";
import { authService } from "../services/auth.service";

async function getUser(headers: any) {
  const token = headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  return authService.validateToken(token);
}

export const messageRoutes = new Elysia({ prefix: "/api/messages" })
  // Get messages for a room
  .get("/room/:roomId", async ({ params, query }: any) => {
    const limit = parseInt(query?.limit || "50");
    const messages = messageService.getRoomMessages(params.roomId, limit);
    return { success: true, data: messages };
  })

  // Edit a message
  .patch("/:id", async ({ params, body, headers, set }: any) => {
    const user = await getUser(headers);
    if (!user) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    const { content } = body as any;
    if (!content) {
      set.status = 400;
      return { success: false, error: "Content required" };
    }

    try {
      const message = messageService.editMessage(params.id, user.id, content);
      return { success: true, data: message };
    } catch (e: any) {
      set.status = 403;
      return { success: false, error: e.message };
    }
  })

  // Delete a message
  .delete("/:id", async ({ params, headers, set }: any) => {
    const user = await getUser(headers);
    if (!user) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    try {
      messageService.deleteMessage(params.id, user.id);
      return { success: true, message: "Message deleted" };
    } catch (e: any) {
      set.status = 403;
      return { success: false, error: e.message };
    }
  });
