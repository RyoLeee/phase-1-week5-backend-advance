import { pgTable, uuid, varchar, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const theaters = pgTable("theaters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  totalScreens: integer("total_screens"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const seats = pgTable("seats", {
  id: uuid("id").primaryKey().defaultRandom(),
  movieScheduleId: varchar("movie_schedule_id", { length: 255 }),
  seatCode: varchar("seat_code", { length: 20 }),
  status: varchar("status", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const movies = pgTable("movies", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  genre: varchar("genre", { length: 100 }),
  duration: integer("duration"),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const movieSchedules = pgTable("movie_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  movieId: uuid("movie_id"),
  theaterId: uuid("theater_id"),
  screenNumber: numeric("screen_number"),
  duration: integer("duration"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time")
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  movieId: uuid("movie_id"),
  theaterId: uuid("theater_id"),
  screenNumber: numeric("screen_number"),
  duration: integer("duration"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time")
});