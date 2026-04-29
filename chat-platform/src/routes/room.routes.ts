import Elysia from "elysia";
import { roomService } from "../services/room.service";
import { authService } from "../services/auth.service";

// Middleware helper to get user from token
async function getUser(headers: any) {
  const token = headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  return authService.validateToken(token);
}

export const roomRoutes = new Elysia({ prefix: "/api/rooms" })
  // Get all public rooms
  .get("/", async () => {
    const rooms = roomService.getAllRooms();
    return { success: true, data: rooms };
  })

  // Get room by ID
  .get("/:id", async ({ params, set }: any) => {
    const room = roomService.getRoomById(params.id);
    if (!room) {
      set.status = 404;
      return { success: false, error: "Room not found" };
    }
    return { success: true, data: room };
  })

  // Get room members
  .get("/:id/members", async ({ params }: any) => {
    const members = roomService.getRoomMembers(params.id);
    return { success: true, data: members };
  })

  // Create room (auth required)
  .post("/", async ({ body, headers, set }: any) => {
    const user = await getUser(headers);
    if (!user) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    const { name, description, isPrivate } = body as any;
    if (!name) {
      set.status = 400;
      return { success: false, error: "Room name required" };
    }

    try {
      const room = roomService.createRoom(name, description || "", user.id, isPrivate || false);
      return { success: true, data: room };
    } catch (e: any) {
      set.status = 400;
      return { success: false, error: e.message };
    }
  })

  // Delete room (owner only)
  .delete("/:id", async ({ params, headers, set }: any) => {
    const user = await getUser(headers);
    if (!user) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    try {
      roomService.deleteRoom(params.id, user.id);
      return { success: true, message: "Room deleted" };
    } catch (e: any) {
      set.status = 403;
      return { success: false, error: e.message };
    }
  })

  // Join room
  .post("/:id/join", async ({ params, headers, set }: any) => {
    const user = await getUser(headers);
    if (!user) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    try {
      const member = roomService.joinRoom(params.id, user.id);
      return { success: true, data: member };
    } catch (e: any) {
      set.status = 400;
      return { success: false, error: e.message };
    }
  })

  // Leave room
  .post("/:id/leave", async ({ params, headers, set }: any) => {
    const user = await getUser(headers);
    if (!user) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    try {
      roomService.leaveRoom(params.id, user.id);
      return { success: true, message: "Left room" };
    } catch (e: any) {
      set.status = 400;
      return { success: false, error: e.message };
    }
  })

  // Get user's rooms
  .get("/user/mine", async ({ headers, set }: any) => {
    const user = await getUser(headers);
    if (!user) {
      set.status = 401;
      return { success: false, error: "Authentication required" };
    }

    const rooms = roomService.getUserRooms(user.id);
    return { success: true, data: rooms };
  });
