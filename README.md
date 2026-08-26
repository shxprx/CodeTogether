# 🚀 Code Together — Realtime Collaborative Code Editor

A real-time collaborative code editor where multiple users can join the same room using a shareable Room ID, edit code together with live synchronization, and compile & execute code securely inside Docker containers.

Built as an **SDE placement project**, emphasizing backend engineering, WebSocket communication, Docker sandboxing, clean architecture, and system design.

---

## ✨ Features

- **Room Management** — Create/join rooms via shareable Room ID
- **Real-time Collaboration** — Multiple users editing simultaneously with instant sync
- **Shared Language Selection** — Switch between C++, Python, and Java
- **Code Execution** — Compile and run code inside secure Docker sandboxes
- **Shared Output** — Execution results broadcast to all participants
- **Participant List** — See who's in the room with join/leave notifications
- **One Compilation at a Time** — Per-room compilation lock prevents conflicts
- **Auto Cleanup** — Empty rooms are deleted after 5 minutes of inactivity

---

## 🏗️ Architecture

```
┌──────────────────┐          ┌──────────────────────────────────┐
│                  │  HTTP    │           Backend                │
│     React +      │◄────────►│         (Express)               │
│     Monaco       │  WS     │                                  │
│     Editor       │◄═══════►│  ┌──────────┐  ┌──────────────┐ │
│                  │          │  │   Room    │  │   WebSocket  │ │
│  (Vite Dev)      │          │  │  Manager  │  │   Server     │ │
└──────────────────┘          │  └──────────┘  └──────────────┘ │
                              │                                  │
                              │  ┌──────────────────────────┐   │
                              │  │    Executor Registry      │   │
                              │  │  ┌─────┐ ┌──────┐ ┌────┐│   │
                              │  │  │ C++ │ │Python│ │Java││   │
                              │  │  └──┬──┘ └──┬───┘ └──┬─┘│   │
                              │  └─────┼───────┼────────┼───┘   │
                              └────────┼───────┼────────┼───────┘
                                       │       │        │
                              ┌────────▼───────▼────────▼───────┐
                              │         Docker Containers        │
                              │  (isolated, no network, fresh)   │
                              └──────────────────────────────────┘
```

### Key Principles

| Principle | Implementation |
|-----------|---------------|
| Single Responsibility | RoomManager owns rooms, Executors handle Docker, Routes handle HTTP |
| Backend is Source of Truth | Code, language, participants — all owned by backend |
| Stateless Executors | Each execution gets a fresh workspace and container |
| No if-else chains | ExecutorRegistry maps language → executor |
| Separation of Concerns | Business logic, networking, and execution are fully separated |

---

## 📁 Folder Structure

```
proj2/
├── backend/
│   ├── src/
│   │   ├── config/constants.js         # All limits, ports, languages
│   │   ├── core/
│   │   │   ├── Room.js                 # Room data model
│   │   │   ├── Participant.js          # Participant data model
│   │   │   └── RoomManager.js          # Room lifecycle (singleton)
│   │   ├── routes/
│   │   │   ├── roomRoutes.js           # POST /api/rooms
│   │   │   └── executionRoutes.js      # POST /api/run
│   │   ├── websocket/
│   │   │   ├── wsServer.js             # WebSocket server + broadcast
│   │   │   └── wsHandlers.js           # Message handlers
│   │   ├── executors/
│   │   │   ├── executors.js            # Cpp, Python, Java executors
│   │   │   └── ExecutorRegistry.js     # Language → Executor mapping
│   │   ├── utils/
│   │   │   ├── logger.js               # Structured JSON logging
│   │   │   └── workspaceManager.js     # Temp directory management
│   │   └── server.js                   # Entry point
│   ├── docker/
│   │   ├── cpp/Dockerfile
│   │   ├── python/Dockerfile
│   │   └── java/Dockerfile
│   └── workspace/                      # Temp execution dirs (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home/                   # Landing page
│   │   │   ├── Room/                   # Editor, TopBar, Output, Participants
│   │   │   └── shared/                 # ConnectionStatus, Toast
│   │   ├── context/RoomContext.jsx     # Centralized state
│   │   ├── hooks/useWebSocket.js       # WebSocket hook
│   │   ├── services/api.js            # HTTP API calls
│   │   └── App.jsx                    # Routing
│   └── index.html
│
└── README.md
```

---

## 🔌 API Reference

### HTTP Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/rooms` | — | `{ roomId }` |
| POST | `/api/run` | `{ roomId, stdin }` | `{ output, exitCode }` |
| GET | `/api/health` | — | `{ status, timestamp }` |

> **Why does `/api/run` only take `roomId` and `stdin`?**
> The backend already has the latest code and language in the room's state. Sending them from the frontend would break the "backend is source of truth" principle.

### WebSocket Protocol

#### Client → Server

| Type | Payload |
|------|---------|
| `JOIN_ROOM` | `{ roomId, username }` |
| `CODE_CHANGE` | `{ code }` |
| `LANGUAGE_CHANGE` | `{ language }` |
| `LEAVE_ROOM` | `{}` |

#### Server → Client

| Type | Payload |
|------|---------|
| `ROOM_STATE` | `{ roomId, code, language, participants, output }` |
| `USER_JOINED` | `{ socketId, username, participants }` |
| `USER_LEFT` | `{ socketId, username, participants }` |
| `CODE_UPDATED` | `{ code }` |
| `LANGUAGE_UPDATED` | `{ language, code }` |
| `OUTPUT_UPDATED` | `{ output }` |
| `ERROR` | `{ message }` |

---

## 🔄 Sequence Diagrams

### Create Room & Join

```
Client A                    Server
   │                          │
   │  POST /api/rooms         │
   │─────────────────────────►│
   │  { roomId: "abc123" }    │
   │◄─────────────────────────│
   │                          │
   │  WS: JOIN_ROOM           │
   │  { roomId, username }    │
   │═════════════════════════►│
   │                          │  RoomManager.joinRoom()
   │  WS: ROOM_STATE          │
   │  { roomId, code, ... }   │
   │◄═════════════════════════│
   │                          │
```

### Second User Joins

```
Client A        Server         Client B
   │               │               │
   │               │  WS: JOIN_ROOM│
   │               │◄══════════════│
   │               │               │
   │               │  ROOM_STATE   │
   │               │══════════════►│
   │               │               │
   │  USER_JOINED  │               │
   │◄══════════════│               │
   │               │               │
```

### Code Execution Flow

```
Client A        Server         Docker          Client B
   │               │               │               │
   │ POST /api/run │               │               │
   │ { roomId,     │               │               │
   │   stdin }     │               │               │
   │──────────────►│               │               │
   │               │               │               │
   │               │ OUTPUT_UPDATED│               │
   │  "Compiling.."│ (broadcast)   │"Compiling..." │
   │◄══════════════│══════════════════════════════►│
   │               │               │               │
   │               │ docker run    │               │
   │               │──────────────►│               │
   │               │  stdout/err   │               │
   │               │◄──────────────│               │
   │               │               │               │
   │               │ OUTPUT_UPDATED│               │
   │  output       │ (broadcast)   │  output       │
   │◄══════════════│══════════════════════════════►│
   │               │               │               │
   │  HTTP response│               │               │
   │◄──────────────│               │               │
```

---

## 🔐 Security

| Measure | Detail |
|---------|--------|
| Docker sandbox | Every execution runs in an isolated container |
| No network | `--network none` flag on all containers |
| Filesystem isolation | Only workspace directory is mounted |
| Memory limit | 256 MB per container |
| CPU limit | 0.5 CPUs per container |
| Process limit | 64 PIDs max per container |
| Execution timeout | 5 seconds |
| Code size limit | 100 KB |
| Input size limit | 10 KB |
| One compilation per room | `isCompiling` lock prevents concurrent execution |
| Backend validation | Every request validated (fields, types, business rules) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (with WSL2 backend on Windows)

### 1. Build Docker Images (one time)

```bash
docker build -t code-executor-cpp ./backend/docker/cpp
docker build -t code-executor-python ./backend/docker/python
docker build -t code-executor-java ./backend/docker/java
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Use It

1. Open `http://localhost:5173`
2. Enter your username
3. Click **Create New Room**
4. Share the Room ID with others
5. They enter the Room ID and click **Join Room**
6. Start coding together!

---

## 🏛️ Room Lifecycle

```
Create Room
    │
    ▼
Join Room ◄──── Someone rejoins?──── Yes ──┐
    │                                       │
    ▼                                       │
Collaborate                                 │
    │                                       │
    ▼                                       │
Leave Room                                  │
    │                                       │
    ▼                                       │
Participants = 0?                           │
    │                                       │
    Yes                                     │
    │                                       │
    ▼                                       │
Start 5-min timer ──────────────────────────┘
    │
    No rejoin
    │
    ▼
Delete Room
```

---

## 🔮 Future Enhancements

The architecture is designed to evolve without redesign:

- **Redis** — for pub/sub and distributed state
- **Worker queues** (BullMQ) — for execution pipeline
- **Authentication** — JWT-based user auth
- **Database** — persistent rooms and history
- **OT/CRDT** — operational transforms for conflict resolution
- **Cursor sync** — show other users' cursor positions
- **Multi-file projects** — file tree with tabs
- **Chat** — in-room messaging
- **Horizontal scaling** — multiple backend instances behind a load balancer

---

## 🎯 Placement Interview Talking Points

This project demonstrates knowledge of:

| Concept | Where It's Used |
|---------|----------------|
| Real-time systems | WebSocket server, live code sync |
| Backend architecture | Express, clean separation of concerns |
| API design | REST endpoints, WebSocket protocol |
| State management | RoomManager, React Context |
| Concurrency | One compilation per room, race condition awareness |
| Docker sandboxing | Isolated containers, no network, resource limits |
| Secure code execution | Timeout, size limits, filesystem isolation |
| Clean software design | Single Responsibility, Executor Registry pattern |
| System design | Room lifecycle, cleanup timers, broadcast patterns |
| Error handling | Expected vs unexpected errors, graceful degradation |
| Extensible architecture | Adding a language = one executor + one Dockerfile |

---

## 📄 License

This project is built for educational and placement purposes.
