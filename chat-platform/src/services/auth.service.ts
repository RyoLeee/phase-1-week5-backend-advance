import { db } from "../db";
import { users, tokens } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export class AuthService {
  async register(username: string, email: string, password: string) {
    // Check existing user
    const existingUser = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existingUser) {
      throw new Error("Username already taken");
    }

    const existingEmail = db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingEmail) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    db.insert(users)
      .values({
        id: userId,
        username,
        email,
        password: hashedPassword,
      })
      .run();

    const user = db.select().from(users).where(eq(users.id, userId)).get();
    return user;
  }

  async login(username: string, password: string) {
    const user = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error("Invalid username or password");
    }

    // Create token
    const tokenValue = randomUUID() + "-" + randomUUID();
    const tokenId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    db.insert(tokens)
      .values({
        id: tokenId,
        userId: user.id,
        token: tokenValue,
        expiresAt,
      })
      .run();

    return { user, token: tokenValue };
  }

  async validateToken(token: string) {
    const now = new Date().toISOString();

    const tokenRecord = db
      .select()
      .from(tokens)
      .where(eq(tokens.token, token))
      .get();

    if (!tokenRecord) return null;
    if (tokenRecord.expiresAt < now) {
      // Expired - delete it
      db.delete(tokens).where(eq(tokens.token, token)).run();
      return null;
    }

    const user = db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .get();

    return user || null;
  }

  async logout(token: string) {
    db.delete(tokens).where(eq(tokens.token, token)).run();
  }

  getUserById(id: string) {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
}

export const authService = new AuthService();
