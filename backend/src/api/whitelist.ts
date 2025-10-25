import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getEthereumService } from '../services/ethereum.js';
import { isEmailDeliverable } from '../utils/emailValidator.js'; // NEW IMPORT

const router = Router();
const prisma = new PrismaClient();

/**
 * Middleware d'authentification basique pour les routes admin
 */
const authenticateAdmin = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.BACKEND_API_KEY;

  if (!expectedApiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

/**
 * POST /api/admin/whitelist/add
 * Ajoute une adresse à la whitelist
 */
router.post('/add', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { address, email } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Validation de l'adresse Ethereum
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // NEW: EMAIL EXISTENCE CHECK
    if (email) {
        const isDeliverable = await isEmailDeliverable(email);
        if (!isDeliverable) {
            return res.status(400).json({ error: 'Email address is not valid or deliverable.' });
        }
    }

    const ethereumService = getEthereumService();
    // Get the contract instance with signer attached
    const kycContract = ethereumService.getContract('kycRegistrySigner');

    if (!kycContract) {
      return res.status(500).json({ error: 'KYC contract signer not available. Check KYC_ADMIN_PRIVATE_KEY.' });
    }

    // Ajout à la whitelist on-chain
    const tx = await kycContract.addWhitelist(address);
    await tx.wait();

    // Mise à jour de la base de données
    await prisma.user.upsert({
      where: { address },
      update: {
        isWhitelisted: true,
        isBlacklisted: false,
        kycStatus: 'approved',
        email: email || undefined,
        updatedAt: new Date()
      },
      create: {
        address,
        email: email || null,
        isWhitelisted: true,
        isBlacklisted: false,
        kycStatus: 'approved'
      }
    });

    res.json({
      success: true,
      message: 'Address added to whitelist',
      address,
      email: email,
      transactionHash: tx.hash
    });

  } catch (error) {
    console.error('Error adding to whitelist:', error);
    res.status(500).json({ error: 'Failed to add address to whitelist' });
  }
});

/**
 * POST /api/admin/whitelist/remove
 * Retire une adresse de la whitelist
 */
router.post('/remove', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const ethereumService = getEthereumService();
    // Use kycRegistrySigner
    const kycContract = ethereumService.getContract('kycRegistrySigner');

    if (!kycContract) {
      return res.status(500).json({ error: 'KYC contract signer not available. Check KYC_ADMIN_PRIVATE_KEY.' });
    }

    // Retrait de la whitelist on-chain
    const tx = await kycContract.removeWhitelist(address);
    await tx.wait();

    // Mise à jour de la base de données
    await prisma.user.update({
      where: { address },
      data: {
        isWhitelisted: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Address removed from whitelist',
      address,
      transactionHash: tx.hash
    });

  } catch (error) {
    console.error('Error removing from whitelist:', error);
    res.status(500).json({ error: 'Failed to remove address from whitelist' });
  }
});

/**
 * POST /api/admin/blacklist/add
 * Ajoute une adresse à la blacklist
 */
router.post('/blacklist/add', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const ethereumService = getEthereumService();
    // Use kycRegistrySigner
    const kycContract = ethereumService.getContract('kycRegistrySigner');

    if (!kycContract) {
      return res.status(500).json({ error: 'KYC contract signer not available. Check KYC_ADMIN_PRIVATE_KEY.' });
    }

    // Ajout à la blacklist on-chain
    const tx = await kycContract.addBlacklist(address);
    await tx.wait();

    // Mise à jour de la base de données
    await prisma.user.upsert({
      where: { address },
      update: {
        isBlacklisted: true,
        isWhitelisted: false,
        kycStatus: 'rejected',
        updatedAt: new Date()
      },
      create: {
        address,
        isBlacklisted: true,
        isWhitelisted: false,
        kycStatus: 'rejected'
      }
    });

    res.json({
      success: true,
      message: 'Address added to blacklist',
      address,
      transactionHash: tx.hash
    });

  } catch (error) {
    console.error('Error adding to blacklist:', error);
    res.status(500).json({ error: 'Failed to add address to blacklist' });
  }
});

/**
 * POST /api/admin/blacklist/remove
 * Retire une adresse de la blacklist
 */
router.post('/blacklist/remove', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const ethereumService = getEthereumService();
    // Use kycRegistrySigner
    const kycContract = ethereumService.getContract('kycRegistrySigner');

    if (!kycContract) {
      return res.status(500).json({ error: 'KYC contract signer not available. Check KYC_ADMIN_PRIVATE_KEY.' });
    }

    // Retrait de la blacklist on-chain
    const tx = await kycContract.removeBlacklist(address);
    await tx.wait();

    // Mise à jour de la base de données
    await prisma.user.update({
      where: { address },
      data: {
        isBlacklisted: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Address removed from blacklist',
      address,
      transactionHash: tx.hash
    });

  } catch (error) {
    console.error('Error removing from blacklist:', error);
    res.status(500).json({ error: 'Failed to remove address from blacklist' });
  }
});

/**
 * GET /api/admin/whitelist/:address
 * Récupère le statut KYC d'une adresse
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const ethereumService = getEthereumService();
    const isAuthorized = await ethereumService.isAuthorized(address);

    const user = await prisma.user.findUnique({
      where: { address }
    });

    res.json({
      address,
      isAuthorized,
      isWhitelisted: user?.isWhitelisted || false,
      isBlacklisted: user?.isBlacklisted || false,
      kycStatus: user?.kycStatus || 'pending',
      email: user?.email || null, // Include email in response
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt
    });

  } catch (error) {
    console.error('Error getting KYC status:', error);
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

/**
 * GET /api/admin/whitelist
 * Récupère la liste des utilisateurs avec leur statut KYC
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
          id: true,
          address: true,
          email: true, // Select email field
          isWhitelisted: true,
          isBlacklisted: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
      }
    });

    const total = await prisma.user.count();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting users list:', error);
    res.status(500).json({ error: 'Failed to get users list' });
  }
});

export default router;