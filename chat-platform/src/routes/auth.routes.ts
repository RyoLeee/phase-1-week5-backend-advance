import Elysia from "elysia";
import { authService } from "../services/auth.service";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post("/register", async ({ body, set }: any) => {
    const { username, email, password } = body as any;

    if (!username || !email || !password) {
      set.status = 400;
      return {
        success: false,
        error: "Username, email, and password required",
      };
    }

    try {
      const user = await authService.register(username, email, password);
      return {
        success: true,
        data: { id: user!.id, username: user!.username, email: user!.email },
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, error: e.message };
    }
  })

  .post("/login", async ({ body, set }: any) => {
    const { username, password } = body as any;

    if (!username || !password) {
      set.status = 400;
      return { success: false, error: "Username and password required" };
    }

    try {
      const { user, token } = await authService.login(username, password);
      return {
        success: true,
        data: {
          token,
          user: { id: user.id, username: user.username, email: user.email },
        },
      };
    } catch (e: any) {
      set.status = 401;
      return { success: false, error: e.message };
    }
  })

  .post("/logout", async ({ headers, set }: any) => {
    const token = headers.authorization?.replace("Bearer ", "");
    if (token) await authService.logout(token);
    return { success: true };
  })

  .get("/me", async ({ headers, set }: any) => {
    const token = headers.authorization?.replace("Bearer ", "");
    if (!token) {
      set.status = 401;
      return { success: false, error: "No token" };
    }

    const user = await authService.validateToken(token);
    if (!user) {
      set.status = 401;
      return { success: false, error: "Invalid token" };
    }

    return {
      success: true,
      data: { id: user.id, username: user.username, email: user.email },
    };
  });
