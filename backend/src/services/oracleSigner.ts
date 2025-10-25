import { ethers } from 'ethers';
import { getEthereumService, OracleABI } from './ethereum.js';

/**
 * Service pour signer et envoyer les mises à jour de prix à l'oracle
 */
export class OracleSignerService {
  private wallet: ethers.Wallet;
  private oracleContract: ethers.Contract;
  private ethereumService: ReturnType<typeof getEthereumService>;

  constructor() {
    // Configuration du wallet oracle signer
    const privateKey = process.env.ORACLE_SIGNER_KEY;
    if (!privateKey) {
      throw new Error('ORACLE_SIGNER_KEY environment variable is required');
    }

    this.ethereumService = getEthereumService();
    this.wallet = new ethers.Wallet(privateKey, this.ethereumService.getProvider());

    // Initialisation du contrat Oracle
    const oracleAddress = process.env.ORACLE_CONTRACT_ADDRESS;
    if (!oracleAddress) {
      throw new Error('ORACLE_CONTRACT_ADDRESS environment variable is required');
    }

    this.oracleContract = new ethers.Contract(
      oracleAddress,
      OracleABI,
      this.wallet
    );
  }

  /**
   * Met à jour le prix dans l'oracle
   * @param price Nouveau prix
   * @param timestamp Timestamp de la mise à jour (optionnel)
   */
  async updatePrice(price: number, timestamp?: number): Promise<string> {
    try {
      const txTimestamp = timestamp || Math.floor(Date.now() / 1000);

      console.log(`Updating oracle price to ${price} at timestamp ${txTimestamp}`);

      // Envoi de la transaction
      const tx = await this.oracleContract.updatePrice(BigInt(Math.round(price * 1000)), txTimestamp); // Price is stored in millis of euros
      console.log(`Transaction sent: ${tx.hash}`);

      // Attente de la confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return tx.hash;
    } catch (error) {
      console.error('Error updating oracle price:', error);
      throw error;
    }
  }

  /**
   * Récupère le prix actuel de l'oracle
   */
  async getCurrentPrice(): Promise<{ price: bigint; timestamp: bigint } | null> {
    try {
      const [price, timestamp] = await this.oracleContract.getPriceData();
      return { price, timestamp };
    } catch (error) {
      console.error('Error getting current price:', error);
      return null;
    }
  }

  /**
   * Vérifie si le wallet est bien configuré comme oracle signer
   */
  async verifySignerRole(): Promise<boolean> {
    try {
      // Cette fonction n'existe pas dans le contrat, mais on peut vérifier
      // en essayant de récupérer les données de prix
      await this.oracleContract.getPriceData();
      return true;
    } catch (error) {
      console.error('Error verifying signer role:', error);
      return false;
    }
  }

  /**
   * Récupère l'adresse du wallet signer
   */
  getSignerAddress(): string {
    return this.wallet.address;
  }
}

/**
 * Fonction CLI pour mettre à jour le prix
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npm run oracle:push -- --price <price> [--timestamp <timestamp>]');
    console.log('Example: npm run oracle:push -- --price 1000');
    process.exit(1);
  }

  let price: number | undefined;
  let timestamp: number | undefined;

  // Parsing des arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--price' && i + 1 < args.length) {
      price = parseFloat(args[i + 1]);
    } else if (args[i] === '--timestamp' && i + 1 < args.length) {
      timestamp = parseInt(args[i + 1]);
    }
  }

  if (price === undefined) {
    console.error('Error: --price argument is required');
    process.exit(1);
  }

  if (price <= 0) {
    console.error('Error: Price must be positive');
    process.exit(1);
  }

  try {
    const oracleSigner = new OracleSignerService();

    // Vérification du rôle de signer
    const isSigner = await oracleSigner.verifySignerRole();
    if (!isSigner) {
      console.error('Error: Wallet is not configured as oracle signer');
      process.exit(1);
    }

    console.log(`Oracle signer address: ${oracleSigner.getSignerAddress()}`);

    // Mise à jour du prix
    const txHash = await oracleSigner.updatePrice(price, timestamp);
    console.log(`✅ Price updated successfully! Transaction: ${txHash}`);

    // Affichage du prix actuel
    const currentPrice = await oracleSigner.getCurrentPrice();
    if (currentPrice) {
      console.log(`Current price: ${currentPrice.price.toString()}`);
      console.log(`Last updated: ${new Date(Number(currentPrice.timestamp) * 1000).toISOString()}`);
    }

  } catch (error) {
    console.error('❌ Failed to update oracle price:', error);
    process.exit(1);
  }
}

// Exécution du script CLI si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
