import Elysia from "elysia";
import ejs from "ejs";
import path from "path";
import { roomService } from "../services/room.service";
import { authService } from "../services/auth.service";

const viewsDir = path.join(process.cwd(), "src/views");

async function render(template: string, data: Record<string, any> = {}) {
  return ejs.renderFile(path.join(viewsDir, template), data, { async: true });
}

async function getUser(headers: any) {
  const token = headers["x-auth-token"] || headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  return authService.validateToken(token);
}

export const viewRoutes = new Elysia()
  // Home / landing page
  .get("/", async ({ headers, set }: any) => {
    const rooms = roomService.getAllRooms();
    const html = await render("pages/index.ejs", { rooms });
    set.headers["content-type"] = "text/html";
    return html;
  })

  // Login page
  .get("/login", async ({ set }: any) => {
    const html = await render("pages/login.ejs");
    set.headers["content-type"] = "text/html";
    return html;
  })

  // Register page
  .get("/register", async ({ set }: any) => {
    const html = await render("pages/register.ejs");
    set.headers["content-type"] = "text/html";
    return html;
  })

  // Chat room page
  .get("/chat/:roomId", async ({ params, set }: any) => {
    const room = roomService.getRoomById(params.roomId);
    if (!room) {
      set.status = 404;
      return "Room not found";
    }

    const html = await render("pages/chat.ejs", { room });
    set.headers["content-type"] = "text/html";
    return html;
  })

  // Dashboard - list rooms, create room
  .get("/dashboard", async ({ set }: any) => {
    const rooms = roomService.getAllRooms();
    const html = await render("pages/dashboard.ejs", { rooms });
    set.headers["content-type"] = "text/html";
    return html;
  });
