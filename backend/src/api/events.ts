import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/events/recent
 * Récupère les événements récents
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string; // 'transfer', 'kyc', 'oracle'

    let events: any[] = [];

    if (!type || type === 'transfer') {
      const transfers = await prisma.transferEvent.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          from: true,
          to: true,
          token: true
        }
      });

      events = events.concat(transfers.map(transfer => ({
        type: 'transfer',
        id: transfer.id,
        txHash: transfer.txHash,
        from: transfer.fromAddress,
        to: transfer.toAddress,
        tokenAddress: transfer.tokenAddress,
        tokenId: transfer.tokenId,
        amount: transfer.amount?.toString(),
        tokenType: transfer.token.type,
        tokenSymbol: transfer.token.symbol,
        blockNumber: transfer.blockNumber.toString(),
        timestamp: transfer.timestamp.toISOString(),
        createdAt: transfer.createdAt.toISOString()
      })));
    }

    if (!type || type === 'kyc') {
      const kycEvents = await prisma.kycEvent.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' }
      });

      events = events.concat(kycEvents.map(event => ({
        type: 'kyc',
        id: event.id,
        userAddress: event.userAddress,
        action: event.action,
        txHash: event.txHash,
        blockNumber: event.blockNumber.toString(),
        timestamp: event.timestamp.toISOString(),
        createdAt: event.createdAt.toISOString()
      })));
    }

    if (!type || type === 'oracle') {
      const oracleEvents = await prisma.oraclePrice.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' }
      });

      events = events.concat(oracleEvents.map(event => ({
        type: 'oracle',
        id: event.id,
        price: event.price.toString(),
        txHash: event.txHash,
        blockNumber: event.blockNumber.toString(),
        timestamp: event.timestamp.toISOString(),
        createdAt: event.createdAt.toISOString()
      })));
    }

    // Tri par timestamp décroissant
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limite le nombre d'événements retournés
    events = events.slice(0, limit);

    res.json({
      events,
      count: events.length
    });

  } catch (error) {
    console.error('Error getting recent events:', error);
    res.status(500).json({ error: 'Failed to get recent events' });
  }
});

/**
 * GET /api/events/user/:address
 * Récupère les événements d'un utilisateur spécifique
 */
router.get('/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Récupération des transferts
    const [transfersFrom, transfersTo] = await Promise.all([
      prisma.transferEvent.findMany({
        where: { fromAddress: address },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          token: true
        }
      }),
      prisma.transferEvent.findMany({
        where: { toAddress: address },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          token: true
        }
      })
    ]);

    // Récupération des événements KYC
    const kycEvents = await prisma.kycEvent.findMany({
      where: { userAddress: address },
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' }
    });

    // Combinaison et tri des événements
    const allEvents = [
      ...transfersFrom.map(t => ({ ...t, direction: 'out' })),
      ...transfersTo.map(t => ({ ...t, direction: 'in' })),
      ...kycEvents.map(k => ({ ...k, type: 'kyc' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      address,
      events: allEvents.slice(0, limit),
      pagination: {
        page,
        limit,
        total: allEvents.length
      }
    });

  } catch (error) {
    console.error('Error getting user events:', error);
    res.status(500).json({ error: 'Failed to get user events' });
  }
});

/**
 * GET /api/events/token/:address
 * Récupère les événements d'un token spécifique
 */
router.get('/token/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const transfers = await prisma.transferEvent.findMany({
      where: { tokenAddress: address },
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        from: true,
        to: true,
        token: true
      }
    });

    const total = await prisma.transferEvent.count({
      where: { tokenAddress: address }
    });

    res.json({
      tokenAddress: address,
      transfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting token events:', error);
    res.status(500).json({ error: 'Failed to get token events' });
  }
});

/**
 * GET /api/events/stats
 * Récupère les statistiques des événements
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalTransfers,
      totalKycEvents,
      totalOracleUpdates,
      recentTransfers,
      recentKycEvents
    ] = await Promise.all([
      prisma.transferEvent.count(),
      prisma.kycEvent.count(),
      prisma.oraclePrice.count(),
      prisma.transferEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
          }
        }
      }),
      prisma.kycEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
          }
        }
      })
    ]);

    res.json({
      totalTransfers,
      totalKycEvents,
      totalOracleUpdates,
      last24h: {
        transfers: recentTransfers,
        kycEvents: recentKycEvents
      }
    });

  } catch (error) {
    console.error('Error getting events stats:', error);
    res.status(500).json({ error: 'Failed to get events stats' });
  }
});

export default router;
