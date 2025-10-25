# Tokenized Asset Management Platform

Une plateforme complète de gestion d'actifs tokenisés avec contrôle KYC intégré, trading décentralisé et oracle de prix en temps réel.

## 🚀 Fonctionnalités

### Contrats Blockchain (Solidity)
- **KYCRegistry** : Gestion des listes blanches et noires avec contrôle d'accès
- **FundToken** : Token ERC20 avec enforcement KYC sur les transferts
- **CertificateNFT** : NFT ERC721 pour les certificats de propriété
- **Oracle** : Stockage et mise à jour des prix des actifs
- **NFTEscrow** : Système d'escrow sécurisé pour le trading de NFT avec résolution de litiges

### Backend (Node.js + TypeScript + Prisma)
- **Indexer** : Synchronisation des événements blockchain avec PostgreSQL (Transfer, KYC, Oracle)
- **API REST** : Endpoints pour la gestion KYC, oracle et événements
- **Service Oracle** : Script pour mettre à jour les prix on-chain
- **WebSocket** : Mises à jour en temps réel pour le frontend
- **Event Decoding** : Décodage optimisé des événements avec gestion des paramètres indexés

### Frontend (Next.js + TypeScript)
- **Dashboard** : Vue d'ensemble des tokens et événements
- **KYC** : Interface de soumission et suivi des vérifications
- **Mint** : Création de tokens ERC20 et certificats NFT
- **Trading** : Interface de trading DEX via Uniswap
- **Admin Panel** : Gestion des listes KYC

## 📋 Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Foundry** (forge, cast, anvil)
- **PostgreSQL** >= 13
- **Git**

## 🛠️ Installation

### 1. Cloner le repository

```bash
git clone https://github.com/your-username/tokenized-asset-management-platform.git
cd tokenized-asset-management-platform
```

### 2. Installer les dépendances

```bash
# Installation de toutes les dépendances
npm run install:all

# Ou installation individuelle
npm run install:contracts
npm run install:backend
npm run install:frontend
```

### 3. Configuration de l'environnement

Copiez les fichiers d'exemple et configurez vos variables :

```bash
# Backend
cp backend/env.example backend/.env

# Frontend
cp frontend/env.local.example frontend/.env.local

# Contrats
cp contracts/env.example contracts/.env
```

### 4. Configuration de la base de données

```bash
# Démarrer PostgreSQL
# Sur macOS avec Homebrew
brew services start postgresql

# Sur Ubuntu/Debian
sudo systemctl start postgresql

# Créer la base de données
createdb tokenized_assets

# Exécuter les migrations
npm run migrate:db
npm run generate:db
```

## 🚀 Démarrage en développement

### 1. Démarrer tous les services

```bash
# Démarrer backend et frontend en parallèle
npm run dev:all

# Ou démarrer individuellement
npm run dev:backend  # Port 3001
npm run dev:frontend # Port 3000
```

### 2. Démarrer l'indexer

```bash
# Dans un terminal séparé
npm run indexer:start
```

### 3. Accéder à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Prisma Studio** : `npm run studio:db`

## 🌐 Déploiement Public avec Ngrok

Pour exposer votre backend publiquement (tests, démos, webhooks) :

### Installation rapide

```bash
# 1. Installer ngrok
sudo snap install ngrok  # Linux
brew install ngrok/ngrok/ngrok  # macOS

# 2. Authentification
ngrok config add-authtoken YOUR_TOKEN

# 3. Démarrer le backend
cd backend && npm run dev

# 4. Lancer ngrok (dans un nouveau terminal)
./ngrok-start.sh
```

Le script affichera votre URL publique : `https://abc123.ngrok.io`

### Mise à jour du frontend

```bash
# Mettre à jour automatiquement la configuration
./ngrok-update-frontend.sh https://abc123.ngrok.io

# Redémarrer le frontend
cd frontend && npm run dev
```

### Dashboard ngrok

Accédez au dashboard pour inspecter les requêtes :
```
http://localhost:4040
```

**📖 Documentation complète** : Voir [NGROK_GUIDE.md](./NGROK_GUIDE.md) pour plus de détails, troubleshooting et alternatives de déploiement production.

## 📦 Déploiement des contrats

### 1. Configuration des variables d'environnement

Éditez `contracts/.env` avec vos clés :

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
DEPLOYER_PRIVATE_KEY=0x...
ORACLE_SIGNER_KEY=0x...
ORACLE_SIGNER_ADDRESS=0x...
UNISWAP_ROUTER_ADDRESS=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
```

### 2. Déploiement sur Sepolia

```bash
# Déployer tous les contrats
npm run deploy:contracts

# Vérifier les contrats sur Etherscan
npm run verify:contracts
```

### 3. Mise à jour des adresses

Après déploiement, mettez à jour les adresses dans :
- `backend/.env`
- `frontend/.env.local`

## 🧪 Tests

### Tests des contrats

```bash
# Tests Foundry
npm run test:contracts

# Tests avec couverture
cd contracts && forge coverage
```

### Tests du backend

```bash
# Tests Jest
npm run test:backend

# Tests avec couverture
cd backend && npm run test:coverage
```

## 📊 Utilisation

### 1. Vérification KYC

1. Connectez votre wallet sur http://localhost:3000
2. Allez sur la page KYC
3. Remplissez le formulaire de vérification
4. Attendez l'approbation par un administrateur

### 2. Mint de tokens

1. Assurez-vous d'être autorisé (KYC approuvé)
2. Allez sur la page Mint
3. Choisissez le type de token (ERC20 ou ERC721)
4. Remplissez les détails et exécutez la transaction

### 3. Trading DEX

1. Allez sur la page Trading
2. Sélectionnez les tokens à échanger
3. Entrez le montant et la tolérance au slippage
4. Approuvez les tokens puis exécutez le swap

### 4. Administration

1. Utilisez l'API avec la clé admin
2. Ajoutez/retirez des adresses des listes KYC
3. Surveillez les événements via le dashboard

## 🔧 Scripts disponibles

### Scripts principaux

```bash
# Installation
npm run install:all

# Développement
npm run dev:all

# Build
npm run build:all

# Tests
npm run test:all

# Linting
npm run lint:all

# Formatage
npm run format:all
```

### Scripts de déploiement

```bash
# Contrats
npm run deploy:contracts
npm run verify:contracts

# Base de données
npm run migrate:db
npm run generate:db
npm run studio:db

# Services
npm run indexer:start
npm run oracle:push
```

### Scripts Docker

```bash
# Build et démarrage
npm run docker:build
npm run docker:up

# Arrêt
npm run docker:down

# Logs
npm run docker:logs
```

### Scripts Ngrok

```bash
# Démarrer ngrok pour le backend
./ngrok-start.sh

# Mettre à jour le frontend avec l'URL ngrok
./ngrok-update-frontend.sh https://your-id.ngrok.io
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Ethereum)    │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • API REST      │    │ • KYCRegistry   │
│ • KYC           │    │ • Indexer       │    │ • FundToken     │
│ • Mint          │    │ • WebSocket     │    │ • CertificateNFT│
│ • Trading       │    │ • Oracle Service│    │ • Oracle        │
│                 │    │                 │    │ • NFTEscrow     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Wallets       │    │   Database      │    │   DEX (Uniswap) │
│                 │    │   (PostgreSQL) │    │                 │
│ • MetaMask      │    │ • Users         │    │ • Router V2     │
│ • WalletConnect │    │ • Events        │    │ • Pools         │
│ • Injected      │    │ • Prices        │    │ • Swaps         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────┬───────┴───────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   Ngrok Tunnel  │
                │   (Public URL)  │
                │                 │
                │ • HTTPS Auto    │
                │ • Dashboard     │
                │ • Inspection    │
                └─────────────────┘
```

## 🔒 Sécurité

### Bonnes pratiques implémentées

- **Contrôle d'accès** : Rôles et permissions granulaires
- **Validation des entrées** : Sanitisation et validation côté serveur
- **Gestion des clés** : Variables d'environnement sécurisées
- **Audit des contrats** : Tests complets et vérification
- **Monitoring** : Logs et métriques de sécurité

### Recommandations

1. **Ne jamais commiter** les clés privées
2. **Utiliser des wallets dédiés** pour le déploiement
3. **Auditer les contrats** avant déploiement en production
4. **Monitorer les événements** suspects
5. **Mettre à jour régulièrement** les dépendances

## 🐛 Dépannage

### Problèmes courants

#### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est démarré
brew services list | grep postgresql

# Redémarrer PostgreSQL
brew services restart postgresql
```

#### Erreur de compilation des contrats
```bash
# Nettoyer le cache Foundry
cd contracts && forge clean

# Recompiler
forge build
```

#### Erreur de connexion au RPC
```bash
# Vérifier la configuration RPC
echo $SEPOLIA_RPC_URL

# Tester la connexion
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $SEPOLIA_RPC_URL
```

#### Erreur de migration Prisma
```bash
# Réinitialiser la base de données
cd backend && npx prisma migrate reset

# Régénérer le client
npx prisma generate
```

#### Problèmes de déploiement (nonce/gas)
```bash
forge script Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --slow
```

```

## 📚 Documentation technique

### Contrats

- [KYCRegistry](./contracts/src/KYCRegistry.sol) : Gestion des listes KYC
- [FundToken](./contracts/src/FundToken.sol) : Token ERC20 avec KYC
- [CertificateNFT](./contracts/src/CertificateNFT.sol) : NFT ERC721
- [Oracle](./contracts/src/Oracle.sol) : Gestion des prix
- [NFTEscrow](./contracts/src/NFTEscrow.sol) : Escrow sécurisé pour NFT
- [DexIntegrationHelper](./contracts/src/DexIntegrationHelper.sol) : Utilitaires DEX

### API

- [Endpoints KYC](./backend/src/api/whitelist.ts) : Gestion des listes
- [Endpoints Oracle](./backend/src/api/oracle.ts) : Gestion des prix
- [Endpoints Events](./backend/src/api/events.ts) : Événements blockchain

### Frontend

- [Dashboard](./frontend/pages/dashboard.tsx) : Vue d'ensemble
- [KYC](./frontend/pages/kyc.tsx) : Vérification d'identité
- [Mint](./frontend/pages/mint.tsx) : Création de tokens
- [Trading](./frontend/pages/trade.tsx) : Trading DEX

## 🤝 Contribution

### Processus de contribution

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Standards de code

- **Solidity** : Suivre les conventions Solidity
- **TypeScript** : Utiliser ESLint et Prettier
- **Commits** : Format conventional commits
- **Tests** : Couverture de tests > 80%

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [OpenZeppelin](https://openzeppelin.com/) pour les contrats de base
- [Foundry](https://book.getfoundry.sh/) pour l'outillage Solidity
- [Next.js](https://nextjs.org/) pour le framework React
- [Prisma](https://www.prisma.io/) pour l'ORM
- [Wagmi](https://wagmi.sh/) pour l'intégration Ethereum

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/your-username/tokenized-asset-management-platform/issues)
- **Discussions** : [GitHub Discussions](https://github.com/your-username/tokenized-asset-management-platform/discussions)
- **Email** : support@tokenized-assets.com

---

**Développé avec ❤️ pour la communauté blockchain**
