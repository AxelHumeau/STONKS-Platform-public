# Guide de Déploiement - Tokenized Asset Management Platform

Ce guide détaille le processus de déploiement complet de la plateforme sur Sepolia (testnet) et en production.

## 📋 Prérequis

### Outils requis
- **Node.js** >= 18.0.0
- **Foundry** (forge, cast, anvil)
- **PostgreSQL** >= 13
- **Docker** (optionnel)
- **Git**

### Comptes et services
- **Infura** ou **Alchemy** (RPC Ethereum)
- **Etherscan** (vérification des contrats)
- **PostgreSQL** (base de données)
- **Redis** (cache, optionnel)

## 🔧 Configuration initiale

### 1. Cloner et installer

```bash
git clone https://github.com/your-username/tokenized-asset-management-platform.git
cd tokenized-asset-management-platform
npm run install:all
```

### 2. Configuration des variables d'environnement

#### Backend (`backend/.env`)
```bash
# Configuration serveur
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# Blockchain
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
DEPLOYER_PRIVATE_KEY=0x...
ORACLE_SIGNER_KEY=0x...

# Contrats (à remplir après déploiement)
KYC_CONTRACT_ADDRESS=0x...
FUND_CONTRACT_ADDRESS=0x...
NFT_CONTRACT_ADDRESS=0x...
ORACLE_CONTRACT_ADDRESS=0x...
DEX_CONTRACT_ADDRESS=0x...

# DEX
UNISWAP_ROUTER_ADDRESS=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D

# Base de données
DATABASE_URL=postgresql://user:password@host:5432/database

# API
BACKEND_API_KEY=your-secure-api-key

# Oracle
ORACLE_SIGNER_ADDRESS=0x...
```

#### Frontend (`frontend/.env.local`)
```bash
# Backend
NEXT_PUBLIC_BACKEND_URL=https://api.your-domain.com

# Blockchain
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Contrats
NEXT_PUBLIC_CONTRACT_FUND=0x...
NEXT_PUBLIC_CONTRACT_NFT=0x...
NEXT_PUBLIC_CONTRACT_KYC=0x...
NEXT_PUBLIC_CONTRACT_ORACLE=0x...
NEXT_PUBLIC_CONTRACT_DEX=0x...

# DEX
NEXT_PUBLIC_UNISWAP_ROUTER=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
```

#### Contrats (`contracts/.env`)
```bash
# RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Clés
DEPLOYER_PRIVATE_KEY=0x...
ORACLE_SIGNER_KEY=0x...

# DEX
UNISWAP_ROUTER_ADDRESS=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D

# Oracle
ORACLE_SIGNER_ADDRESS=0x...

# Etherscan
ETHERSCAN_API_KEY=your-etherscan-api-key
```

## 🚀 Déploiement sur Sepolia

### 1. Préparation des contrats

```bash
cd contracts

# Compiler les contrats
forge build

# Exécuter les tests
forge test

# Vérifier la couverture
forge coverage
```

### 2. Déploiement des contrats

```bash
# Déployer tous les contrats
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast

# Ou utiliser le script npm
npm run deploy:contracts
```

### 3. Vérification des contrats

```bash
# Vérifier KYCRegistry
forge verify-contract --chain sepolia --watch --constructor-args $(cast abi-encode "constructor()") 0x...

# Vérifier FundToken
forge verify-contract --chain sepolia --watch --constructor-args $(cast abi-encode "constructor(string,string,address)" "Fund Token" "FUND" 0x...) 0x...

# Vérifier CertificateNFT
forge verify-contract --chain sepolia --watch --constructor-args $(cast abi-encode "constructor(string,string,address)" "Certificate NFT" "CERT" 0x...) 0x...

# Vérifier Oracle
forge verify-contract --chain sepolia --watch --constructor-args $(cast abi-encode "constructor(address)" 0x...) 0x...

# Vérifier DexIntegrationHelper
forge verify-contract --chain sepolia --watch --constructor-args $(cast abi-encode "constructor(address)" 0x...) 0x...
```

### 4. Mise à jour des adresses

Après déploiement, mettez à jour les adresses dans :
- `backend/.env`
- `frontend/.env.local`

## 🗄️ Configuration de la base de données

### 1. Création de la base de données

```bash
# Créer la base de données
createdb tokenized_assets

# Ou avec psql
psql -U postgres -c "CREATE DATABASE tokenized_assets;"
```

### 2. Migration et génération

```bash
# Exécuter les migrations
cd backend
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate
```

### 3. Vérification

```bash
# Ouvrir Prisma Studio
npx prisma studio

# Vérifier la connexion
npx prisma db pull
```

## 🔧 Déploiement du backend

### 1. Build de production

```bash
cd backend

# Installer les dépendances de production
npm ci --only=production

# Build de l'application
npm run build
```

### 2. Démarrage du service

```bash
# Démarrer le serveur
npm run start

# Ou avec PM2
pm2 start dist/server.js --name "tokenized-assets-backend"

# Démarrer l'indexer
pm2 start dist/indexer/indexer.js --name "tokenized-assets-indexer"
```

### 3. Configuration Nginx (optionnel)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🌐 Déploiement du frontend

### 1. Build de production

```bash
cd frontend

# Installer les dépendances
npm ci

# Build de production
npm run build
```

### 2. Démarrage du service

```bash
# Démarrer le serveur
npm run start

# Ou avec PM2
pm2 start npm --name "tokenized-assets-frontend" -- start
```

### 3. Configuration Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐳 Déploiement avec Docker

### 1. Configuration Docker Compose

```bash
# Copier les variables d'environnement
cp .env.example .env

# Éditer les variables
nano .env
```

### 2. Build et démarrage

```bash
# Build des images
docker-compose build

# Démarrer les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### 3. Vérification

```bash
# Vérifier les services
docker-compose ps

# Tester la connectivité
curl http://localhost:3001/health
curl http://localhost:3000
```

## 🔒 Configuration SSL

### 1. Certificats Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir les certificats
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 2. Configuration Nginx SSL

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        # ... autres configurations
    }
}
```

## 📊 Monitoring et logs

### 1. Configuration des logs

```bash
# Logs avec PM2
pm2 logs

# Logs avec Docker
docker-compose logs -f

# Logs système
journalctl -u your-service -f
```

### 2. Monitoring de santé

```bash
# Vérifier la santé des services
curl http://localhost:3001/health
curl http://localhost:3000

# Monitoring avec PM2
pm2 monit
```

### 3. Métriques

```bash
# Métriques système
htop
df -h
free -h

# Métriques réseau
netstat -tulpn
ss -tulpn
```

## 🧪 Tests de déploiement

### 1. Tests de connectivité

```bash
# Test RPC
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $SEPOLIA_RPC_URL

# Test API
curl http://localhost:3001/health
curl http://localhost:3001/api/oracle/price

# Test Frontend
curl http://localhost:3000
```

### 2. Tests fonctionnels

```bash
# Test de connexion wallet
# Test de soumission KYC
# Test de mint de tokens
# Test de trading DEX
```

### 3. Tests de charge

```bash
# Test de charge avec Artillery
npm install -g artillery
artillery quick --count 10 --num 5 http://localhost:3001/health
```

## 🔄 Mise à jour et maintenance

### 1. Mise à jour du code

```bash
# Pull des dernières modifications
git pull origin main

# Mise à jour des dépendances
npm run install:all

# Rebuild
npm run build:all

# Redémarrage des services
pm2 restart all
```

### 2. Mise à jour de la base de données

```bash
# Nouvelles migrations
cd backend
npx prisma migrate deploy

# Régénération du client
npx prisma generate
```

### 3. Sauvegarde

```bash
# Sauvegarde de la base de données
pg_dump tokenized_assets > backup_$(date +%Y%m%d_%H%M%S).sql

# Sauvegarde des fichiers
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/application
```

## 🚨 Dépannage

### Problèmes courants

#### Erreur de connexion RPC
```bash
# Vérifier la configuration
echo $SEPOLIA_RPC_URL

# Tester la connexion
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $SEPOLIA_RPC_URL
```

#### Erreur de base de données
```bash
# Vérifier la connexion
psql $DATABASE_URL -c "SELECT 1;"

# Vérifier les migrations
npx prisma migrate status
```

#### Erreur de build
```bash
# Nettoyer le cache
npm run clean:all

# Rebuild
npm run build:all
```

## 📞 Support

- **Documentation** : [README.md](README.md)
- **Issues** : [GitHub Issues](https://github.com/your-username/tokenized-asset-management-platform/issues)
- **Email** : support@tokenized-assets.com

---

**Déploiement réussi ! 🎉**
