import http from 'http';
import express from 'express';
import cors from 'cors';
import { PORT } from './config/constants.js';
import { initWebSocketServer } from './websocket/wsServer.js';
import roomRoutes from './routes/roomRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import { logger } from './utils/logger.js';

// ── Express App ──────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json({ limit: '200kb' }));

// Health check — useful for Docker/deployment verification
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/rooms', roomRoutes);
app.use('/api/run', executionRoutes);

// ── HTTP + WebSocket Server ─────────────────────────────

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
