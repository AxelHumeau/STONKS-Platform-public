#!/bin/bash

# Script de déploiement sur Sepolia pour la plateforme Tokenized Asset Management
# Ce script déploie tous les contrats et configure l'environnement

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement sur Sepolia - Tokenized Asset Management Platform"
echo "=============================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
print_status "Vérification des prérequis..."

# Vérifier Foundry
if ! command -v forge &> /dev/null; then
    print_error "Foundry n'est pas installé"
    exit 1
fi

# Vérifier les variables d'environnement
if [ -z "$SEPOLIA_RPC_URL" ]; then
    print_error "SEPOLIA_RPC_URL n'est pas défini"
    exit 1
fi

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    print_error "DEPLOYER_PRIVATE_KEY n'est pas défini"
    exit 1
fi

if [ -z "$ORACLE_SIGNER_KEY" ]; then
    print_error "ORACLE_SIGNER_KEY n'est pas défini"
    exit 1
fi

if [ -z "$ORACLE_SIGNER_ADDRESS" ]; then
    print_error "ORACLE_SIGNER_ADDRESS n'est pas défini"
    exit 1
fi

if [ -z "$UNISWAP_ROUTER_ADDRESS" ]; then
    print_error "UNISWAP_ROUTER_ADDRESS n'est pas défini"
    exit 1
fi

print_success "Variables d'environnement vérifiées"
echo ""

# Préparation du déploiement
print_status "Préparation du déploiement..."

cd contracts

# Compilation
print_status "Compilation des contrats..."
forge build
print_success "Contrats compilés"

# Tests
print_status "Exécution des tests..."
forge test
print_success "Tests réussis"

# Déploiement
print_status "Déploiement des contrats sur Sepolia..."
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast --verify
print_success "Contrats déployés et vérifiés"

# Récupération des adresses déployées
print_status "Récupération des adresses des contrats..."

# Note: En production, il faudrait parser la sortie de forge script
# Pour ce script, nous supposons que les adresses sont affichées
print_warning "Veuillez noter les adresses des contrats déployés :"
echo "KYCRegistry: [à remplir]"
echo "FundToken: [à remplir]"
echo "CertificateNFT: [à remplir]"
echo "Oracle: [à remplir]"
echo "DexIntegrationHelper: [à remplir]"

cd ..
echo ""

# Configuration des services
print_status "Configuration des services..."

# Mise à jour des fichiers .env
print_status "Mise à jour des fichiers de configuration..."

# Backend
if [ -f "backend/.env" ]; then
    print_status "Mise à jour de backend/.env..."
    # Note: En production, il faudrait automatiser cette mise à jour
    print_warning "Veuillez mettre à jour backend/.env avec les adresses des contrats"
else
    print_warning "Fichier backend/.env manquant, copie de l'exemple..."
    cp backend/env.example backend/.env
fi

# Frontend
if [ -f "frontend/.env.local" ]; then
    print_status "Mise à jour de frontend/.env.local..."
    # Note: En production, il faudrait automatiser cette mise à jour
    print_warning "Veuillez mettre à jour frontend/.env.local avec les adresses des contrats"
else
    print_warning "Fichier frontend/.env.local manquant, copie de l'exemple..."
    cp frontend/env.local.example frontend/.env.local
fi

echo ""

# Test de connectivité
print_status "Test de connectivité..."

# Test RPC
print_status "Test de la connexion RPC..."
RPC_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $SEPOLIA_RPC_URL)

if echo "$RPC_RESPONSE" | grep -q "result"; then
    print_success "Connexion RPC réussie"
else
    print_error "Échec de la connexion RPC"
    exit 1
fi

echo ""

# Instructions post-déploiement
print_status "Instructions post-déploiement"
echo "=================================="

print_warning "Étapes manuelles requises :"
echo "1. Mettre à jour les adresses des contrats dans :"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Configurer la base de données PostgreSQL :"
echo "   - Créer la base de données"
echo "   - Exécuter les migrations Prisma"
echo ""
echo "3. Démarrer les services :"
echo "   - Backend: npm run start"
echo "   - Frontend: npm run start"
echo "   - Indexer: npm run indexer:start"
echo ""
echo "4. Tester les fonctionnalités :"
echo "   - Connexion wallet"
echo "   - Soumission KYC"
echo "   - Mint de tokens"
echo "   - Trading DEX"

echo ""
print_success "🎉 Déploiement sur Sepolia terminé !"
print_status "La plateforme est maintenant déployée sur le testnet Sepolia."

echo ""
print_status "Ressources utiles :"
echo "- Etherscan Sepolia: https://sepolia.etherscan.io/"
echo "- Documentation: README.md"
echo "- Guide de déploiement: DEPLOYMENT.md"
echo "- Support: GitHub Issues"

echo ""
print_warning "N'oubliez pas de :"
echo "- Sauvegarder les clés privées en sécurité"
echo "- Tester toutes les fonctionnalités"
echo "- Monitorer les transactions"
echo "- Documenter les adresses des contrats"
