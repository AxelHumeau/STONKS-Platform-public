import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { getEthereumService } from '../services/ethereum.js';

/**
 * Indexer pour synchroniser les événements blockchain avec la base de données
 */
export class BlockchainIndexer {
  private prisma: PrismaClient;
  private ethereumService: ReturnType<typeof getEthereumService>;
  private isRunning: boolean = false;
  private lastProcessedBlock: bigint = BigInt(0);
  private readonly BATCH_SIZE = 10; // Nombre de blocs à traiter par batch
  private readonly POLLING_INTERVAL = 20000; // 20 secondes

  constructor() {
    this.prisma = new PrismaClient();
    this.ethereumService = getEthereumService();
  }

  /**
   * Démarre l'indexer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Indexer is already running');
      return;
    }

    console.log('🚀 Starting blockchain indexer...');
    this.isRunning = true;

    try {
      // Récupération du dernier bloc traité
      await this.loadLastProcessedBlock();

      // Démarrage du polling
      await this.startPolling();
    } catch (error) {
      console.error('❌ Failed to start indexer:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Arrête l'indexer
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping blockchain indexer...');
    this.isRunning = false;
    await this.prisma.$disconnect();
  }

  /**
   * Charge le dernier bloc traité depuis la base de données
   */
  private async loadLastProcessedBlock(): Promise<void> {
    try {
      const lastEvent = await this.prisma.transferEvent.findFirst({
        orderBy: { blockNumber: 'desc' }
      });

      if (lastEvent) {
        this.lastProcessedBlock = lastEvent!.blockNumber;
        console.log(`📊 Last processed block: ${this.lastProcessedBlock}`);
      } else {
        // Commencer depuis un bloc récent si aucune donnée
        const currentBlock = await this.ethereumService.getProvider().getBlockNumber();
        this.lastProcessedBlock = BigInt(currentBlock - this.BATCH_SIZE); // BATCH_SIZE blocs back
        console.log(`📊 Starting from block: ${this.lastProcessedBlock}`);
      }
    } catch (error) {
      console.error('Error loading last processed block:', error);
      throw error;
    }
  }

  /**
   * Démarre le polling des nouveaux blocs
   */
  private async startPolling(): Promise<void> {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        await this.processNewBlocks();
      } catch (error) {
        console.error('Error in polling cycle:', error);
      }

      setTimeout(poll, this.POLLING_INTERVAL);
    };
    await poll();
  }

  /**
   * Traite les nouveaux blocs
   */
  private async processNewBlocks(): Promise<void> {
    try {
      const currentBlock = await this.ethereumService.getProvider().getBlockNumber();
      const fromBlock = this.lastProcessedBlock + BigInt(1);
      const toBlock = BigInt(currentBlock);

      if (fromBlock > toBlock) {
        console.log('⏳ No new blocks to process');
        return;
      }

      console.log(`🔄 Processing blocks ${fromBlock} to ${toBlock}`);

      let processedBlocks = fromBlock;
      while (processedBlocks <= toBlock) {
        const batchEnd = processedBlocks + BigInt(this.BATCH_SIZE) - BigInt(1);
        const actualEnd = batchEnd > toBlock ? toBlock : batchEnd;

        await this.processBlockRange(processedBlocks, actualEnd);
        processedBlocks = actualEnd + BigInt(1);
      }

      this.lastProcessedBlock = toBlock;
      console.log(`✅ Processed up to block ${toBlock}`);

    } catch (error) {
      console.error('Error processing new blocks:', error);
      throw error;
    }
  }

  /**
   * Traite une plage de blocs
   */
  private async processBlockRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    try {
      await this.processTransferEvents(fromBlock, toBlock);
      await this.processKycEvents(fromBlock, toBlock);
      await this.processOracleEvents(fromBlock, toBlock);

    } catch (error) {
      console.error(`Error processing block range ${fromBlock}-${toBlock}:`, error);
      throw error;
    }
  }

  /**
   * Traite les événements de transfert
   */
  private async processTransferEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
    const addresses = this.ethereumService.getAddresses();

    if (addresses.fundToken) {
      await this.processTokenTransfers(addresses.fundToken, fromBlock, toBlock, 'ERC20');
    }

    if (addresses.certificateNFT) {
      await this.processTokenTransfers(addresses.certificateNFT, fromBlock, toBlock, 'ERC721');
    }
  }

  /**
   * Traite les transferts d'un token spécifique
   */
  private async processTokenTransfers(
    contractAddress: string,
    fromBlock: bigint,
    toBlock: bigint,
    tokenType: 'ERC20' | 'ERC721'
  ): Promise<void> {
    try {
      const filter = {
        address: contractAddress,
        topics: [
          ethers.id('Transfer(address,address,uint256)') // ERC20 et ERC721 utilisent le même événement
        ],
        fromBlock,
        toBlock
      };

      const logs = await this.ethereumService.getProvider().getLogs(filter);

      for (const log of logs) {
        await this.processTransferLog(log, tokenType);
      }

    } catch (error) {
      console.error(`Error processing ${tokenType} transfers:`, error);
    }
  }

  /**
   * Traite un log de transfert
   */
  private async processTransferLog(log: ethers.Log, tokenType: 'ERC20' | 'ERC721'): Promise<void> {
    try {
      // FIX: Slice to remove 12 bytes of padding (24 hex chars) from the 32-byte topic for address
      const from = ethers.getAddress('0x' + log.topics[1].slice(26));
      const to = ethers.getAddress('0x' + log.topics[2].slice(26));

      let valueOrTokenId: bigint;
      if (log.data === '0x' || log.data === '0x0') {
        valueOrTokenId = BigInt(0);
      } else {
        [valueOrTokenId] = ethers.AbiCoder.defaultAbiCoder().decode(
          ['uint256'],
          log.data
        );
      }

      const block = await this.ethereumService.getProvider().getBlock(log.blockNumber);

      await this.ethereumService.syncUserData(from);
      await this.ethereumService.syncUserData(to);

      await this.prisma.transferEvent.create({
        data: {
          txHash: log.transactionHash,
          fromAddress: from,
          toAddress: to,
          tokenAddress: log.address,
          tokenId: tokenType === 'ERC721' ? valueOrTokenId.toString() : null,
          amount: tokenType === 'ERC20' ? valueOrTokenId : null,
          blockNumber: BigInt(log.blockNumber),
          logIndex: log.index,
          timestamp: new Date(Number(block!.timestamp) * 1000)
        }
      });

      console.log(`📝 Processed ${tokenType} transfer: ${from} -> ${to}`);

    } catch (error) {
      console.error('Error processing transfer log:', error);
    }
  }

  /**
   * Traite les événements KYC
   */
  private async processKycEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
    const addresses = this.ethereumService.getAddresses();

    if (!addresses.kycRegistry) return;

    try {
      const whitelistFilter = {
        address: addresses.kycRegistry,
        topics: [ethers.id('WhitelistUpdated(address,bool)')],
        fromBlock,
        toBlock
      };

      const blacklistFilter = {
        address: addresses.kycRegistry,
        topics: [ethers.id('BlacklistUpdated(address,bool)')],
        fromBlock,
        toBlock
      };

      const [whitelistLogs, blacklistLogs] = await Promise.all([
        this.ethereumService.getProvider().getLogs(whitelistFilter),
        this.ethereumService.getProvider().getLogs(blacklistFilter),
      ]);

      // Process Whitelist/Blacklist events
      for (const log of whitelistLogs) {
        await this.processKycLog(log, 'whitelist');
      }

      for (const log of blacklistLogs) {
        await this.processKycLog(log, 'blacklist');
      }

    } catch (error) {
      console.error('Error processing KYC events:', error);
    }
  }

  /**
   * Traite un log KYC Updated (Whitelist/Blacklist)
   */
  private async processKycLog(log: ethers.Log, type: 'whitelist' | 'blacklist'): Promise<void> {
    try {
      const userAddress = ethers.getAddress('0x' + log.topics[1].slice(26));

      const [status] = ethers.AbiCoder.defaultAbiCoder().decode(
        ['bool'],
        log.data
      );
      const block = await this.ethereumService.getProvider().getBlock(log.blockNumber);

      const action = status ? `${type}_added` : `${type}_removed`;

      await this.prisma.kycEvent.create({
        data: {
          userAddress,
          action,
          txHash: log.transactionHash,
          blockNumber: BigInt(log.blockNumber),
          timestamp: new Date(Number(block!.timestamp) * 1000)
        }
      });

      // Mise à jour du statut utilisateur
      await this.prisma.user.upsert({
        where: { address: userAddress },
        update: {
          isWhitelisted: type === 'whitelist' ? status : undefined,
          isBlacklisted: type === 'blacklist' ? status : undefined,
          updatedAt: new Date(),
          kycStatus: status ? (type === 'whitelist' ? 'approved' : 'rejected') : 'pending' // Simplified status logic
        },
        create: {
          address: userAddress,
          isWhitelisted: type === 'whitelist' ? status : false,
          isBlacklisted: type === 'blacklist' ? status : false,
          kycStatus: status ? (type === 'whitelist' ? 'approved' : 'rejected') : 'pending'
        }
      });

      console.log(`📝 Processed KYC event: ${action} for ${userAddress}`);

    } catch (error) {
      console.error('Error processing KYC log:', error);
    }
  }

  /**
   * Traite les événements Oracle
   */
  private async processOracleEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
    const addresses = this.ethereumService.getAddresses();

    if (!addresses.oracle) return;

    try {
      const filter = {
        address: addresses.oracle,
        topics: [ethers.id('PriceUpdated(uint256,uint256)')],
        fromBlock,
        toBlock
      };

      const logs = await this.ethereumService.getProvider().getLogs(filter);

      for (const log of logs) {
        await this.processOracleLog(log);
      }

    } catch (error) {
      console.error('Error processing Oracle events:', error);
    }
  }

  /**
   * Traite un log Oracle
   */
  private async processOracleLog(log: ethers.Log): Promise<void> {
    try {
      const price = BigInt(log.topics[1]);

      const [timestamp] = ethers.AbiCoder.defaultAbiCoder().decode(
        ['uint256'],
        log.data
      );
      const block = await this.ethereumService.getProvider().getBlock(log.blockNumber);

      await this.prisma.oraclePrice.create({
        data: {
          price,
          timestamp: new Date(Number(timestamp) * 1000),
          txHash: log.transactionHash,
          blockNumber: BigInt(log.blockNumber)
        }
      });

      console.log(`📝 Processed Oracle price update: ${price}`);

    } catch (error) {
      console.error('Error processing Oracle log:', error);
    }
  }
}

/**
 * Fonction principale pour démarrer l'indexer
 */
async function main() {
  const indexer = new BlockchainIndexer();

  // Gestion des signaux pour arrêt propre
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });

  try {
    await indexer.start();
  } catch (error) {
    console.error('❌ Indexer failed to start:', error);
    process.exit(1);
  }
}

// Exécution du script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}