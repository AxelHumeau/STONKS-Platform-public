import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

// Interfaces pour les contrats
export interface ContractAddresses {
  kycRegistry: string;
  fundToken: string;
  certificateNFT: string;
  oracle: string;
  // dexHelper: string;
}

// ABIs des contrats (simplifiés pour l'exemple)
export const KYCRegistryABI = [
  "function isAuthorized(address user) external view returns (bool)",
  "function addWhitelist(address user) external",
  "function removeWhitelist(address user) external",
  "function addBlacklist(address user) external",
  "function removeBlacklist(address user) external",
  "event WhitelistUpdated(address indexed user, bool status)",
  "event BlacklistUpdated(address indexed user, bool status)"
];

export const FundTokenABI = [
  "function mint(address to, uint256 amount) external",
  "function isAuthorized(address user) external view returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event TokensMinted(address indexed to, uint256 amount)"
];

export const CertificateNFTABI = [
  "function mintCertificate(address to, string memory metadataURI) external returns (uint256)",
  "function isAuthorized(address user) external view returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event CertificateMinted(address indexed to, uint256 tokenId, string metadataURI)"
];

export const OracleABI = [
  "function updatePrice(uint256 price, uint256 timestamp) external",
  "function getPriceData() external view returns (uint256 price, uint256 timestamp)",
  "function latestPrice() external view returns (uint256)",
  "function updatedAt() external view returns (uint256)",
  "event PriceUpdated(uint256 indexed price, uint256 timestamp)"
];

// export const DexIntegrationHelperABI = [
//   "function approveToken(address token, uint256 amount) external",
//   "function getAllowance(address token, address owner, address spender) external view returns (uint256)",
//   "function getBalance(address token, address account) external view returns (uint256)",
//   "function getRouterInfo() external view returns (address)"
// ];

/**
 * Service Ethereum pour gérer les connexions et interactions avec les contrats
 */
export class EthereumService {
  private provider: ethers.JsonRpcProvider;
  private contracts: Map<string, ethers.Contract>;
  private addresses: ContractAddresses;
  private prisma: PrismaClient;
  private kycAdminWallet: ethers.Wallet | null = null; // NEW

  constructor() {
    // Configuration du provider
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('SEPOLIA_RPC_URL environment variable is required');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contracts = new Map();
    this.prisma = new PrismaClient();

    // Chargement des adresses des contrats
    this.addresses = {
      kycRegistry: process.env.KYC_CONTRACT_ADDRESS || '',
      fundToken: process.env.FUND_CONTRACT_ADDRESS || '',
      certificateNFT: process.env.NFT_CONTRACT_ADDRESS || '',
      oracle: process.env.ORACLE_CONTRACT_ADDRESS || '',
      // dexHelper: process.env.DEX_CONTRACT_ADDRESS || ''
    };

    const kycAdminPrivateKey = process.env.KYC_ADMIN_PRIVATE_KEY;
    if (kycAdminPrivateKey) {
        this.kycAdminWallet = new ethers.Wallet(kycAdminPrivateKey, this.provider);
        console.log(`KYC Admin Wallet Initialized: ${this.kycAdminWallet.address}`);
    } else {
        console.warn('KYC_ADMIN_PRIVATE_KEY not set. Admin operations requiring signing will not work.');
    }

    this.initializeContracts();
  }

  /**
   * Initialise les instances des contrats
   */
  private initializeContracts(): void {
    // KYCRegistry (Read-only)
    if (this.addresses.kycRegistry) {
      this.contracts.set('kycRegistry', new ethers.Contract(
        this.addresses.kycRegistry,
        KYCRegistryABI,
        this.provider
      ));
      
      if (this.kycAdminWallet) {
        this.contracts.set('kycRegistrySigner', new ethers.Contract(
            this.addresses.kycRegistry,
            KYCRegistryABI,
            this.kycAdminWallet
        ));
      }
    }

    // FundToken
    if (this.addresses.fundToken) {
      this.contracts.set('fundToken', new ethers.Contract(
        this.addresses.fundToken,
        FundTokenABI,
        this.provider
      ));
    }

    // CertificateNFT
    if (this.addresses.certificateNFT) {
      this.contracts.set('certificateNFT', new ethers.Contract(
        this.addresses.certificateNFT,
        CertificateNFTABI,
        this.provider
      ));
    }

    // Oracle
    if (this.addresses.oracle) {
      this.contracts.set('oracle', new ethers.Contract(
        this.addresses.oracle,
        OracleABI,
        this.provider
      ));
    }

    // DexIntegrationHelper
    // if (this.addresses.dexHelper) {
    //   this.contracts.set('dexHelper', new ethers.Contract(
    //     this.addresses.dexHelper,
    //     DexIntegrationHelperABI,
    //     this.provider
    //   ));
    // }
  }

  /**
   * Récupère une instance de contrat
   */
  getContract(name: string): ethers.Contract | undefined {
    return this.contracts.get(name);
  }

  /**
   * Récupère le provider
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Récupère les adresses des contrats
   */
  getAddresses(): ContractAddresses {
    return this.addresses;
  }

  /**
   * Vérifie si une adresse est autorisée via KYC
   */
  async isAuthorized(address: string): Promise<boolean> {
    const kycContract = this.getContract('kycRegistry');
    if (!kycContract) {
      throw new Error('KYC Registry contract not initialized');
    }

    try {
      return await kycContract.isAuthorized(address);
    } catch (error) {
      console.error('Error checking KYC authorization:', error);
      return false;
    }
  }

  /**
   * Récupère le solde d'un token pour une adresse
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<bigint> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) external view returns (uint256)'],
        this.provider
      );

      return await tokenContract.balanceOf(userAddress);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Récupère les données de prix de l'oracle
   */
  async getOraclePrice(): Promise<{ price: bigint; timestamp: bigint } | null> {
    const oracleContract = this.getContract('oracle');
    if (!oracleContract) {
      return null;
    }

    try {
      const [price, timestamp] = await oracleContract.getPriceData();
      return { price, timestamp };
    } catch (error) {
      console.error('Error getting oracle price:', error);
      return null;
    }
  }

  /**
   * Synchronise les données d'un utilisateur avec la base de données
   */
  async syncUserData(address: string): Promise<void> {
    try {
      const isAuthorized = await this.isAuthorized(address);

      await this.prisma.user.upsert({
        where: { address },
        update: {
          isWhitelisted: isAuthorized,
          updatedAt: new Date()
        },
        create: {
          address,
          isWhitelisted: isAuthorized,
          isBlacklisted: false,
          kycStatus: isAuthorized ? 'approved' : 'pending'
        }
      });
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  /**
   * Ferme les connexions
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Instance singleton
let ethereumService: EthereumService | null = null;

export function getEthereumService(): EthereumService {
  if (!ethereumService) {
    ethereumService = new EthereumService();
  }
  return ethereumService;
}