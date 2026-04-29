/**
 * WebSocket Server
 * Terpisah dari main server, menangani upgrade dan lifecycle WS
 */

import { wsEngine } from "./engine";
import { randomUUID } from "crypto";

export function setupWebSocket(app: any) {
  app.ws("/ws", {
    open(ws: any) {
      const clientId = randomUUID();
      ws.data = { clientId };
      wsEngine.onConnect(ws, clientId); 

      // Send welcome message
      ws.send(JSON.stringify({
        type: "connected",
        payload: {
          message: "Connected to Chat Platform. Please authenticate.",
          clientId,
        },
      }));
    },

    message(ws: any, message: string | Buffer) {
      const clientId = ws.data?.clientId;
      if (!clientId) return;

      const raw = typeof message === "string" ? message : message.toString();
      wsEngine.onMessage(clientId, raw, ws);
    },

    close(ws: any) {
      const clientId = ws.data?.clientId;
      if (clientId) {
        wsEngine.onDisconnect(clientId);
      }
    },

    error(ws: any, error: Error) {
      console.error("WS Error:", error);
    },
  });

  console.log("🔌 WebSocket server ready at /ws");
}
