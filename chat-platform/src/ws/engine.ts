/**
 * WebSocket Engine
 * Core logic untuk manage connections dan broadcast messages
 * Menggunakan database (bukan in-memory rooms map)
 */

import { db } from "../db";
import { roomMembers } from "../db/schema";
import { eq } from "drizzle-orm";
import { messageService } from "../services/message.service";
import { authService } from "../services/auth.service";
import { roomService } from "../services/room.service";

// WebSocket connection structure
export interface WsClient {
  id: string;
  userId: string;
  username: string;
  currentRoomId: string | null;
  ws: any; // WebSocket instance
}

// Event types
export type WsEventType =
  | "auth"
  | "join_room"
  | "leave_room"
  | "send_message"
  | "edit_message"
  | "delete_message"
  | "ping";

export interface WsEvent {
  type: WsEventType;
  payload: any;
}

export interface WsResponse {
  type: string;
  payload: any;
  error?: string;
}

class WebSocketEngine {
  // Store active connections by connection ID
  private clients: Map<string, WsClient> = new Map();

  // Get all clients in a specific room (from DB + active connections)
  private getClientsInRoom(roomId: string): WsClient[] {
    return Array.from(this.clients.values()).filter(
      (c) => c.currentRoomId === roomId,
    );
  }

  // Broadcast to all clients in a room
  broadcast(roomId: string, event: WsResponse, excludeClientId?: string) {
    const roomClients = this.getClientsInRoom(roomId);
    for (const client of roomClients) {
      if (excludeClientId && client.id === excludeClientId) continue;
      try {
        client.ws.send(JSON.stringify(event));
      } catch (e) {
        // Client might be disconnected
        this.clients.delete(client.id);
      }
    }
  }

  // Send to a specific client
  sendToClient(clientId: string, event: WsResponse) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.ws.send(JSON.stringify(event));
      } catch (e) {
        this.clients.delete(clientId);
      }
    }
  }

  // Handle new connection
  onConnect(ws: any, clientId: string) {
    console.log(`🔌 WS client connected: ${clientId}`);
    // Client is stored after auth
  }

  // Handle disconnection
  onDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(
        `❌ WS client disconnected: ${client.username} (${clientId})`,
      );

      // Notify room members if user was in a room
      if (client.currentRoomId) {
        this.broadcast(client.currentRoomId, {
          type: "user_left",
          payload: {
            userId: client.userId,
            username: client.username,
            roomId: client.currentRoomId,
          },
        });
      }

      this.clients.delete(clientId);
    }
  }

  // Handle incoming message/event
  async onMessage(clientId: string, raw: string, ws: any) {
    let event: WsEvent;

    try {
      event = JSON.parse(raw);
    } catch {
      ws.send(
        JSON.stringify({ type: "error", payload: { message: "Invalid JSON" } }),
      );
      return;
    }

    // AUTH event - must authenticate before anything
    if (event.type === "auth") {
      return await this.handleAuth(clientId, event.payload, ws);
    }

    // All other events require auth
    const client = this.clients.get(clientId);
    if (!client) {
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Not authenticated. Send auth event first." },
        }),
      );
      return;
    }

    switch (event.type) {
      case "join_room":
        await this.handleJoinRoom(client, event.payload);
        break;
      case "leave_room":
        await this.handleLeaveRoom(client);
        break;
      case "send_message":
        await this.handleSendMessage(client, event.payload);
        break;
      case "edit_message":
        await this.handleEditMessage(client, event.payload);
        break;
      case "delete_message":
        await this.handleDeleteMessage(client, event.payload);
        break;
      case "ping":
        this.sendToClient(clientId, {
          type: "pong",
          payload: { ts: Date.now() },
        });
        break;
      default:
        this.sendToClient(clientId, {
          type: "error",
          payload: { message: `Unknown event type: ${event.type}` },
        });
    }
  }

  private async handleAuth(clientId: string, payload: any, ws: any) {
    const { token } = payload;

    if (!token) {
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Token required" },
        }),
      );
      return;
    }

    try {
      const user = await authService.validateToken(token);
      if (!user) {
        ws.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Invalid or expired token" },
          }),
        );
        return;
      }

      // Register client
      const client: WsClient = {
        id: clientId,
        userId: user.id,
        username: user.username,
        currentRoomId: null,
        ws,
      };

      this.clients.set(clientId, client);

      ws.send(
        JSON.stringify({
          type: "auth_success",
          payload: { userId: user.id, username: user.username },
        }),
      );

      console.log(`✅ WS authenticated: ${user.username}`);
    } catch (e: any) {
      ws.send(
        JSON.stringify({ type: "error", payload: { message: e.message } }),
      );
    }
  }

  private async handleJoinRoom(client: WsClient, payload: any) {
    const { roomId } = payload;

    try {
      // Join room in DB (if not already member)
      roomService.joinRoom(roomId, client.userId);

      // Leave previous room
      if (client.currentRoomId && client.currentRoomId !== roomId) {
        this.broadcast(client.currentRoomId, {
          type: "user_left",
          payload: {
            userId: client.userId,
            username: client.username,
            roomId: client.currentRoomId,
          },
        });
      }

      client.currentRoomId = roomId;

      // Get recent messages from DB
      const recentMessages = messageService.getRoomMessages(roomId, 50);
      const members = roomService.getRoomMembers(roomId);

      this.sendToClient(client.id, {
        type: "room_joined",
        payload: {
          roomId,
          messages: recentMessages,
          members,
        },
      });

      // Notify others in room
      this.broadcast(
        roomId,
        {
          type: "user_joined",
          payload: { userId: client.userId, username: client.username, roomId },
        },
        client.id,
      );
    } catch (e: any) {
      this.sendToClient(client.id, {
        type: "error",
        payload: { message: e.message },
      });
    }
  }

  private async handleLeaveRoom(client: WsClient) {
    if (!client.currentRoomId) return;

    const roomId = client.currentRoomId;
    client.currentRoomId = null;

    this.broadcast(roomId, {
      type: "user_left",
      payload: { userId: client.userId, username: client.username, roomId },
    });

    this.sendToClient(client.id, {
      type: "room_left",
      payload: { roomId },
    });
  }

  private async handleSendMessage(client: WsClient, payload: any) {
    if (!client.currentRoomId) {
      this.sendToClient(client.id, {
        type: "error",
        payload: { message: "Join a room first" },
      });
      return;
    }

    const { content } = payload;
    if (!content || !content.trim()) return;

    try {
      const message = messageService.createMessage(
        client.currentRoomId,
        client.userId,
        content.trim(),
      );

      // Broadcast to all in room including sender
      this.broadcast(client.currentRoomId, {
        type: "new_message",
        payload: { message },
      });
    } catch (e: any) {
      this.sendToClient(client.id, {
        type: "error",
        payload: { message: e.message },
      });
    }
  }

  private async handleEditMessage(client: WsClient, payload: any) {
    const { messageId, content } = payload;

    try {
      const message = messageService.editMessage(
        messageId,
        client.userId,
        content,
      );

      if (message && client.currentRoomId) {
        this.broadcast(client.currentRoomId, {
          type: "message_edited",
          payload: { message },
        });
      }
    } catch (e: any) {
      this.sendToClient(client.id, {
        type: "error",
        payload: { message: e.message },
      });
    }
  }

  private async handleDeleteMessage(client: WsClient, payload: any) {
    const { messageId } = payload;

    try {
      const message = messageService.deleteMessage(messageId, client.userId);

      if (message && client.currentRoomId) {
        this.broadcast(client.currentRoomId, {
          type: "message_deleted",
          payload: { messageId, roomId: client.currentRoomId },
        });
      }
    } catch (e: any) {
      this.sendToClient(client.id, {
        type: "error",
        payload: { message: e.message },
      });
    }
  }

  getStats() {
    const clientsByRoom: Record<string, number> = {};
    for (const client of this.clients.values()) {
      if (client.currentRoomId) {
        clientsByRoom[client.currentRoomId] =
          (clientsByRoom[client.currentRoomId] || 0) + 1;
      }
    }
    return {
      totalConnections: this.clients.size,
      clientsByRoom,
    };
  }
}

// Singleton engine instance
export const wsEngine = new WebSocketEngine();
