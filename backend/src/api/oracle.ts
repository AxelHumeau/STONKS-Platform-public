import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getEthereumService } from '../services/ethereum.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/oracle/price
 * Récupère le prix actuel de l'oracle
 */
router.get('/price', async (req: Request, res: Response) => {
  try {
    const ethereumService = getEthereumService();
    const priceData = await ethereumService.getOraclePrice();

    if (!priceData) {
      return res.status(404).json({ error: 'Oracle price not available' });
    }

    res.json({
      price: priceData.price.toString(),
      timestamp: priceData.timestamp.toString(),
      lastUpdated: new Date(Number(priceData.timestamp) * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error getting oracle price:', error);
    res.status(500).json({ error: 'Failed to get oracle price' });
  }
});

/**
 * GET /api/oracle/history
 * Récupère l'historique des prix
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    const prices = await prisma.oraclePrice.findMany({
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' }
    });

    const total = await prisma.oraclePrice.count();

    res.json({
      prices: prices.map(price => ({
        id: price.id,
        price: price.price.toString(),
        timestamp: price.timestamp.toISOString(),
        txHash: price.txHash,
        blockNumber: price.blockNumber.toString(),
        createdAt: price.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting oracle history:', error);
    res.status(500).json({ error: 'Failed to get oracle history' });
  }
});

/**
 * POST /api/oracle/push
 * Déclenche une mise à jour de prix (pour les tests)
 */
router.post('/push', async (req: Request, res: Response) => {
  try {
    const { price } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }

    // Note: En production, cette route devrait être sécurisée
    // et seulement accessible par le service oracle signer
    const { OracleSignerService } = await import('../services/oracleSigner.js');
    const oracleSigner = new OracleSignerService();

    const txHash = await oracleSigner.updatePrice(price);

    res.json({
      success: true,
      message: 'Price update initiated',
      price,
      transactionHash: txHash
    });

  } catch (error) {
    console.error('Error pushing oracle price:', error);
    res.status(500).json({ error: 'Failed to push oracle price' });
  }
});

/**
 * GET /api/oracle/stats
 * Récupère les statistiques de l'oracle
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalUpdates,
      latestPrice,
      firstUpdate,
      lastUpdate
    ] = await Promise.all([
      prisma.oraclePrice.count(),
      prisma.oraclePrice.findFirst({
        orderBy: { timestamp: 'desc' }
      }),
      prisma.oraclePrice.findFirst({
        orderBy: { timestamp: 'asc' }
      }),
      prisma.oraclePrice.findFirst({
        orderBy: { timestamp: 'desc' }
      })
    ]);

    res.json({
      totalUpdates,
      latestPrice: latestPrice ? {
        price: latestPrice.price.toString(),
        timestamp: latestPrice.timestamp.toISOString(),
        txHash: latestPrice.txHash
      } : null,
      firstUpdate: firstUpdate ? firstUpdate.timestamp.toISOString() : null,
      lastUpdate: lastUpdate ? lastUpdate.timestamp.toISOString() : null
    });

  } catch (error) {
    console.error('Error getting oracle stats:', error);
    res.status(500).json({ error: 'Failed to get oracle stats' });
  }
});

export default router;
