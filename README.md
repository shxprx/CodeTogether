# Code Together — Realtime Collaborative Code Editor
A real-time collaborative code editor where multiple users can join the same room using a shareable Room ID, edit code together with live synchronization, and compile & execute code securely inside Docker containers.

##  Getting Started

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



