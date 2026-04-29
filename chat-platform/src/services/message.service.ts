import { db } from "../db";
import { messages, users, roomMembers } from "../db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export class MessageService {
  createMessage(roomId: string, userId: string, content: string) {
    // Check user is member
    const isMember = db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .get();

    if (!isMember) throw new Error("You are not a member of this room");

    const msgId = randomUUID();
    const now = new Date().toISOString();

    db.insert(messages)
      .values({
        id: msgId,
        roomId,
        userId,
        content,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return this.getMessageById(msgId);
  }

  getMessageById(msgId: string) {
    return db
      .select({
        id: messages.id,
        roomId: messages.roomId,
        userId: messages.userId,
        content: messages.content,
        isEdited: messages.isEdited,
        deletedAt: messages.deletedAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        username: users.username,
        avatar: users.avatar,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, msgId))
      .get();
  }

  getRoomMessages(roomId: string, limit = 50) {
    return db
      .select({
        id: messages.id,
        roomId: messages.roomId,
        userId: messages.userId,
        content: messages.content,
        isEdited: messages.isEdited,
        deletedAt: messages.deletedAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        username: users.username,
        avatar: users.avatar,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(and(eq(messages.roomId, roomId), isNull(messages.deletedAt)))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .all()
      .reverse();
  }

  editMessage(msgId: string, userId: string, newContent: string) {
    const msg = db.select().from(messages).where(eq(messages.id, msgId)).get();
    if (!msg) throw new Error("Message not found");
    if (msg.userId !== userId) throw new Error("You can only edit your own messages");
    if (msg.deletedAt) throw new Error("Cannot edit a deleted message");

    const now = new Date().toISOString();
    db.update(messages)
      .set({ content: newContent, isEdited: true, updatedAt: now })
      .where(eq(messages.id, msgId))
      .run();

    return this.getMessageById(msgId);
  }

  deleteMessage(msgId: string, userId: string) {
    const msg = db.select().from(messages).where(eq(messages.id, msgId)).get();
    if (!msg) throw new Error("Message not found");
    if (msg.userId !== userId) throw new Error("You can only delete your own messages");

    const now = new Date().toISOString();
    db.update(messages)
      .set({ deletedAt: now, content: "[This message was deleted]" })
      .where(eq(messages.id, msgId))
      .run();

    return this.getMessageById(msgId);
  }
}

export const messageService = new MessageService();
