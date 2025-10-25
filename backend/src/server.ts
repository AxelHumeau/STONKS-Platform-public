import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { WebSocketServer, type WebSocket } from 'ws';
import { createServer } from 'http';

import whitelistRouter from './api/whitelist.js';
import oracleRouter from './api/oracle.js';
import eventsRouter from './api/events.js';
import { CronJob } from 'cron';
import { randomInt } from 'crypto';

// Chargement des variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration du serveur HTTP
const server = createServer(app);

// Configuration du WebSocket
const wss = new WebSocketServer({ server });

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes API
// Using the explicit router variables
app.use('/api/admin/whitelist', whitelistRouter);
app.use('/api/oracle', oracleRouter);
app.use('/api/events', eventsRouter);

// Route pour récupérer le statut d'un utilisateur
app.get('/api/user/:address/status', async (req, res) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Importation dynamique pour éviter les problèmes de dépendance circulaire
    const { getEthereumService } = await import('./services/ethereum.js');
    const ethereumService = getEthereumService();

    const isAuthorized = await ethereumService.isAuthorized(address);
    const oraclePrice = await ethereumService.getOraclePrice();

    res.json({
      address,
      isAuthorized,
      oraclePrice: oraclePrice ? {
        price: oraclePrice.price.toString(),
        timestamp: oraclePrice.timestamp.toString(),
        lastUpdated: new Date(Number(oraclePrice.timestamp) * 1000).toISOString()
      } : null
    });

  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
});

// Gestion des WebSockets pour les mises à jour en temps réel
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });

  // Envoi d'un message de bienvenue
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Tokenized Asset Management Platform',
    timestamp: new Date().toISOString()
  }));
});

// Fonction pour diffuser des événements à tous les clients connectés
export function broadcastEvent(event: any) {
  const message = JSON.stringify({
    type: 'event',
    data: event,
    timestamp: new Date().toISOString()
  });

  clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

// Gestion des erreurs
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

const oracleUpdateCron = new CronJob("*/10 * * * *", () => {
  import('./services/oracleSigner.js').then(async ({ OracleSignerService }) => {
    const oracleSigner = new OracleSignerService();
    const result = await oracleSigner.getCurrentPrice();
    var newPrice;
    if (result) {
      newPrice = (Number(result.price) / 1000 * (1 + (randomInt(-3, 3) / 100)));
    } else {
      newPrice = 1000000;
    }
    console.log(`Scheduled oracle price update to ${newPrice} from ${result ? Number(result.price) / 1000 : 'N/A'}`);
    oracleSigner.updatePrice(newPrice).catch(error => {
      console.error('Error pushing scheduled oracle price update:', error);
    });
  });
}, null, true, 'Europe/Paris');

export default app;
