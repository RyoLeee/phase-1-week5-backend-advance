# 💬 ChatPlatform

Platform chat real-time berbasis WebSocket dibangun dengan **Bun + Elysia + Drizzle ORM + EJS**.

## 🏗️ Arsitektur

```
chat-platform/
├── src/
│   ├── db/
│   │   ├── index.ts        # Database connection & init (SQLite via Drizzle)
│   │   └── schema.ts       # 5 tabel: users, tokens, rooms, room_members, messages
│   │
│   ├── services/           # Business logic (TERPISAH dari routes/server)
│   │   ├── auth.service.ts   # Register, login, validate token
│   │   ├── room.service.ts   # CRUD rooms, join/leave
│   │   └── message.service.ts # CRUD messages, edit, delete
│   │
│   ├── ws/                 # WebSocket (TERPISAH dari server utama)
│   │   ├── engine.ts       # Core WS logic: manage connections, broadcast
│   │   └── server.ts       # WS lifecycle: open, message, close
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── room.routes.ts
│   │   ├── message.routes.ts
│   │   └── view.routes.ts  # Serve EJS pages
│   │
│   ├── views/              # EJS Templates
│   │   ├── partials/
│   │   │   ├── header.ejs
│   │   │   └── footer.ejs
│   │   └── pages/
│   │       ├── index.ejs     # Landing page
│   │       ├── login.ejs
│   │       ├── register.ejs
│   │       ├── dashboard.ejs # Browse & create rooms
│   │       └── chat.ejs      # Chat room dengan WebSocket
│   │
│   ├── public/
│   │   ├── css/style.css
│   │   └── js/app.js
│   │
│   └── server.ts           # Entry point - compose semua
│
├── package.json
├── drizzle.config.ts
└── tsconfig.json
```

## 🗄️ Database (5 Tabel)

| Tabel | Fungsi |
|-------|--------|
| `users` | Data akun user |
| `tokens` | Session token login |
| `rooms` | Chat rooms |
| `room_members` | Member dari setiap room |
| `messages` | Pesan di setiap room |

## ⚡ WebSocket Events

### Client → Server
| Event | Payload | Keterangan |
|-------|---------|------------|
| `auth` | `{ token }` | Autentikasi (harus pertama) |
| `join_room` | `{ roomId }` | Masuk room |
| `leave_room` | - | Keluar room |
| `send_message` | `{ content }` | Kirim pesan |
| `edit_message` | `{ messageId, content }` | Edit pesan |
| `delete_message` | `{ messageId }` | Hapus pesan |
| `ping` | - | Keepalive |

### Server → Client
| Event | Keterangan |
|-------|------------|
| `connected` | Koneksi berhasil |
| `auth_success` | Auth berhasil |
| `room_joined` | Berhasil join room + history messages |
| `new_message` | Ada pesan baru |
| `message_edited` | Pesan diedit |
| `message_deleted` | Pesan dihapus |
| `user_joined` | User lain join room |
| `user_left` | User lain leave room |
| `error` | Ada error |

## 🚀 Setup & Jalankan

```bash
# Install dependencies
bun install

# Jalankan dev server (auto-reload)
bun dev

# Atau jalankan production
bun start
```

Buka browser di: `http://localhost:3000`

## ✅ Fitur

- [x] Register & Login akun
- [x] Token-based authentication
- [x] Buat chat room
- [x] Delete room (owner only)
- [x] Join room
- [x] Kirim pesan real-time via WebSocket
- [x] Edit pesan sendiri ✏️
- [x] Delete pesan sendiri 🗑️
- [x] Online member list
- [x] System messages (user joined/left)
- [x] Persistent messages (dari database, bukan memory)
- [x] Dark mode UI

## 📡 REST API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/rooms              # Public rooms
POST   /api/rooms              # Create room
GET    /api/rooms/:id
DELETE /api/rooms/:id          # Delete (owner only)
POST   /api/rooms/:id/join
POST   /api/rooms/:id/leave
GET    /api/rooms/:id/members
GET    /api/rooms/user/mine    # My rooms

GET    /api/messages/room/:id  # Get messages
PATCH  /api/messages/:id       # Edit message
DELETE /api/messages/:id       # Delete message
```
