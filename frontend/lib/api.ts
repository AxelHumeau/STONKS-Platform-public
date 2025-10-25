import axios from 'axios';

// Configuration de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const BACKEND_API_KEY = process.env.NEXT_PUBLIC_BACKEND_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types pour les réponses API
export interface UserStatus {
  address: string;
  isAuthorized: boolean;
  oraclePrice?: {
    price: string;
    timestamp: string;
    lastUpdated: string;
  };
}

export interface KycStatus {
  address: string;
  isAuthorized: boolean;
  isWhitelisted: boolean;
  isBlacklisted: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface TransferEvent {
  type: 'transfer';
  id: string;
  txHash: string;
  from: string;
  to: string;
  tokenAddress: string;
  tokenId?: string;
  amount?: string;
  tokenType: 'ERC20' | 'ERC721';
  tokenSymbol: string;
  blockNumber: string;
  timestamp: string;
  createdAt: string;
}

export interface KycEvent {
  type: 'kyc';
  id: string;
  userAddress: string;
  action: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
  createdAt: string;
}

export interface OracleEvent {
  type: 'oracle';
  id: string;
  price: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
  createdAt: string;
}

export type Event = TransferEvent | KycEvent | OracleEvent;

export interface OraclePrice {
  price: string;
  timestamp: string;
  lastUpdated: string;
}

export interface OracleHistory {
  prices: Array<{
    id: string;
    price: string;
    timestamp: string;
    txHash: string;
    blockNumber: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Fonctions API
export const apiService = {
  // Récupère le statut d'un utilisateur
  async getUserStatus(address: string): Promise<UserStatus> {
  const route = `/api/user/${address}/status`;
  console.log('[API CALL] route=getUserStatus', route, 'payload=', { address });
  const response = await api.get(route);
  console.log('[API RESP] route=getUserStatus', response.status, response.data);
  return response.data;
  },

  // Récupère le statut KYC d'un utilisateur
  async getKycStatus(address: string): Promise<KycStatus> {
    const route = `/api/admin/whitelist/${address}`;
    console.log('[API CALL] route=getKycStatus', route, 'payload=', { address });
    const response = await api.get(route, {
      headers: { 'x-api-key': BACKEND_API_KEY }
    });

    console.log('[API RESP] route=getKycStatus', response.status, response.data);
    return response.data;
  },

  // Soumet une demande KYC
  async submitKyc(address: string, email: string): Promise<any> {
    const route = '/api/admin/whitelist/add';
    const payload = { address, email };
    console.log('[API CALL] route=submitKyc', route, 'payload=', payload);

    // Pass the API key in the third argument (config object)
    const response = await api.post(route, payload, {
      headers: { 'x-api-key': BACKEND_API_KEY } // <--- SECURE HEADER
    });

    console.log('[API RESP] route=submitKyc', response.status, response.data);
    return response.data;
  },

  // Récupère les événements récents
  async getRecentEvents(limit = 50, type?: string): Promise<{ events: Event[]; count: number }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (type) params.append('type', type);
  const route = `/api/events/recent?${params.toString()}`;
  console.log('[API CALL] route=getRecentEvents', route, 'payload=', { limit, type });
  const response = await api.get(route);
  console.log('[API RESP] route=getRecentEvents', response.status, response.data);
  return response.data;
  },

  // Récupère les événements d'un utilisateur
  async getUserEvents(address: string, page = 1, limit = 50): Promise<any> {
  const route = `/api/events/user/${address}?page=${page}&limit=${limit}`;
  console.log('[API CALL] route=getUserEvents', route, 'payload=', { address, page, limit });
  const response = await api.get(route);
  console.log('[API RESP] route=getUserEvents', response.status, response.data);
  return response.data;
  },

  // Récupère les événements d'un token
  async getTokenEvents(tokenAddress: string, page = 1, limit = 50): Promise<any> {
  const route = `/api/events/token/${tokenAddress}?page=${page}&limit=${limit}`;
  console.log('[API CALL] route=getTokenEvents', route, 'payload=', { tokenAddress, page, limit });
  const response = await api.get(route);
  console.log('[API RESP] route=getTokenEvents', response.status, response.data);
  return response.data;
  },

  // Récupère le prix actuel de l'oracle
  async getOraclePrice(): Promise<OraclePrice> {
  const route = '/api/oracle/price';
  console.log('[API CALL] route=getOraclePrice', route);
  const response = await api.get(route);
  console.log('[API RESP] route=getOraclePrice', response.status, response.data);
  return response.data;
  },

  // Récupère l'historique des prix
  async getOracleHistory(page = 1, limit = 100): Promise<OracleHistory> {
  const route = `/api/oracle/history?page=${page}&limit=${limit}`;
  console.log('[API CALL] route=getOracleHistory', route, 'payload=', { page, limit });
  const response = await api.get(route);
  console.log('[API RESP] route=getOracleHistory', response.status, response.data);
  return response.data;
  },

  // Récupère les statistiques de l'oracle
  async getOracleStats(): Promise<any> {
  const route = '/api/oracle/stats';
  console.log('[API CALL] route=getOracleStats', route);
  const response = await api.get(route);
  console.log('[API RESP] route=getOracleStats', response.status, response.data);
  return response.data;
  },

  // Récupère les statistiques des événements
  async getEventsStats(): Promise<any> {
  const route = '/api/events/stats';
  console.log('[API CALL] route=getEventsStats', route);
  const response = await api.get(route);
  console.log('[API RESP] route=getEventsStats', response.status, response.data);
  return response.data;
  },
};

// Gestion des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
