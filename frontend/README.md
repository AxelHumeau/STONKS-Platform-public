# Frontend - Tokenized Asset Management Platform - STONKS

## Configuration

### WalletConnect Project ID

Pour obtenir un Project ID WalletConnect :

1. Allez sur [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet
4. Copiez votre Project ID
5. Ajoutez-le dans votre fichier `.env.local` :

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

### Configuration du réseau Sepolia

Le projet est configuré pour utiliser le réseau Sepolia (testnet) par défaut.

Pour ajouter votre propre RPC, modifiez le fichier `.env.local` :

```bash
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
```

Ou utilisez un RPC public :

```bash
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org/
```

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Fonctionnalités

### Connexion de Wallet

- Support de MetaMask, WalletConnect, Coinbase Wallet, et autres wallets
- Configuration RainbowKit pour une expérience utilisateur optimale
- Support du réseau Sepolia

### KYC Application

- Formulaire de demande KYC avec email et adresse wallet
- Auto-remplissage de l'adresse wallet connectée
- Validation des champs

## Structure

```
frontend/
├── components/
│   └── WalletProvider.tsx      # Provider pour RainbowKit + Wagmi
├── lib/
│   └── web3Config.ts          # Configuration RainbowKit
├── pages/
│   ├── _app.tsx               # Configuration globale de l'app
│   └── index.tsx               # Page principale avec KYC modal
└── styles/
    └── globals.css             # Styles globaux
```

## Technologies

- **Next.js 14** - Framework React
- **RainbowKit** - Interface de connexion wallet
- **Wagmi** - Hooks React pour Ethereum
- **Tailwind CSS** - Framework CSS
- **TypeScript** - Typage statique
