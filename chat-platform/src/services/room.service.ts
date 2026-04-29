import { db } from "../db";
import { rooms, roomMembers, messages, users } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export class RoomService {
  createRoom(name: string, description: string, ownerId: string, isPrivate = false) {
    const roomId = randomUUID();

    db.insert(rooms)
      .values({
        id: roomId,
        name,
        description,
        ownerId,
        isPrivate,
      })
      .run();

    // Add owner as member with 'owner' role
    db.insert(roomMembers)
      .values({
        id: randomUUID(),
        roomId,
        userId: ownerId,
        role: "owner",
      })
      .run();

    return db.select().from(rooms).where(eq(rooms.id, roomId)).get();
  }

  deleteRoom(roomId: string, userId: string) {
    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();

    if (!room) throw new Error("Room not found");
    if (room.ownerId !== userId) throw new Error("Only the owner can delete this room");

    db.delete(rooms).where(eq(rooms.id, roomId)).run();
    return true;
  }

  getAllRooms() {
    return db
      .select({
        id: rooms.id,
        name: rooms.name,
        description: rooms.description,
        ownerId: rooms.ownerId,
        isPrivate: rooms.isPrivate,
        createdAt: rooms.createdAt,
        ownerUsername: users.username,
      })
      .from(rooms)
      .leftJoin(users, eq(rooms.ownerId, users.id))
      .where(eq(rooms.isPrivate, false))
      .all();
  }

  getRoomById(roomId: string) {
    return db
      .select({
        id: rooms.id,
        name: rooms.name,
        description: rooms.description,
        ownerId: rooms.ownerId,
        isPrivate: rooms.isPrivate,
        createdAt: rooms.createdAt,
        ownerUsername: users.username,
      })
      .from(rooms)
      .leftJoin(users, eq(rooms.ownerId, users.id))
      .where(eq(rooms.id, roomId))
      .get();
  }

  getUserRooms(userId: string) {
    return db
      .select({
        id: rooms.id,
        name: rooms.name,
        description: rooms.description,
        ownerId: rooms.ownerId,
        isPrivate: rooms.isPrivate,
        createdAt: rooms.createdAt,
        ownerUsername: users.username,
        role: roomMembers.role,
      })
      .from(roomMembers)
      .innerJoin(rooms, eq(roomMembers.roomId, rooms.id))
      .leftJoin(users, eq(rooms.ownerId, users.id))
      .where(eq(roomMembers.userId, userId))
      .all();
  }

  joinRoom(roomId: string, userId: string) {
    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) throw new Error("Room not found");

    // Check if already a member
    const existing = db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .get();

    if (existing) return existing;

    const memberId = randomUUID();
    db.insert(roomMembers)
      .values({
        id: memberId,
        roomId,
        userId,
        role: "member",
      })
      .run();

    return db.select().from(roomMembers).where(eq(roomMembers.id, memberId)).get();
  }

  leaveRoom(roomId: string, userId: string) {
    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) throw new Error("Room not found");
    if (room.ownerId === userId) throw new Error("Owner cannot leave their own room. Delete it instead.");

    db.delete(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .run();

    return true;
  }

  getRoomMembers(roomId: string) {
    return db
      .select({
        id: roomMembers.id,
        userId: roomMembers.userId,
        role: roomMembers.role,
        joinedAt: roomMembers.joinedAt,
        username: users.username,
        avatar: users.avatar,
      })
      .from(roomMembers)
      .innerJoin(users, eq(roomMembers.userId, users.id))
      .where(eq(roomMembers.roomId, roomId))
      .all();
  }

  isMember(roomId: string, userId: string) {
    const member = db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .get();
    return !!member;
  }
}

export const roomService = new RoomService();
