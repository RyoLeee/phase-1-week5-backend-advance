import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { initDatabase } from "./db";

// Routes
import { authRoutes } from "./routes/auth.routes";
import { roomRoutes } from "./routes/room.routes";
import { messageRoutes } from "./routes/message.routes";
import { viewRoutes } from "./routes/view.routes";

// WebSocket
import { setupWebSocket } from "./ws/server";

// Initialize database
initDatabase();

const PORT = parseInt(process.env.PORT || "3000");

const app = new Elysia()
  // Static files
  .use(
    staticPlugin({
      assets: "src/public",
      prefix: "/public",
    })
  )

  // API Routes
  .use(authRoutes)
  .use(roomRoutes)
  .use(messageRoutes)

  // View Routes
  .use(viewRoutes);

// Setup WebSocket (separate from REST routes)
setupWebSocket(app);

// Health check
app.get("/health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      💬 Chat Platform is Running       ║
╠════════════════════════════════════════╣
║  HTTP  → http://localhost:${PORT}         ║
║  WS    → ws://localhost:${PORT}/ws        ║
╠════════════════════════════════════════╣
║  Pages:                                ║
║  /           → Home                    ║
║  /login      → Login                   ║
║  /register   → Register                ║
║  /dashboard  → Browse Rooms            ║
║  /chat/:id   → Chat Room               ║
╠════════════════════════════════════════╣
║  API:                                  ║
║  POST /api/auth/register               ║
║  POST /api/auth/login                  ║
║  GET  /api/rooms                       ║
║  POST /api/rooms                       ║
║  DELETE /api/rooms/:id                 ║
║  POST /api/rooms/:id/join              ║
╚════════════════════════════════════════╝
  `);
});

export type App = typeof app;
