#!/bin/bash

# Script de test complet pour la plateforme Tokenized Asset Management
# Ce script exécute tous les tests et validations nécessaires

set -e  # Arrêter en cas d'erreur

echo "🧪 Démarrage des tests complets de la plateforme Tokenized Asset Management"
echo "=================================================================="

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

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Vérifier Foundry
if ! command -v forge &> /dev/null; then
    print_error "Foundry n'est pas installé"
    exit 1
fi

FORGE_VERSION=$(forge --version)
print_success "Foundry version: $FORGE_VERSION"

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL n'est pas installé - certains tests peuvent échouer"
fi

print_success "Prérequis vérifiés"
echo ""

# Installation des dépendances
print_status "Installation des dépendances..."
npm run install:all
print_success "Dépendances installées"
echo ""

# Tests des contrats
print_status "Exécution des tests des contrats..."
cd contracts

# Compilation
print_status "Compilation des contrats..."
forge build
print_success "Contrats compilés"

# Tests unitaires
print_status "Exécution des tests unitaires..."
forge test
print_success "Tests unitaires réussis"

# Tests de couverture
print_status "Exécution des tests de couverture..."
forge coverage
print_success "Tests de couverture terminés"

cd ..
echo ""

# Tests du backend
print_status "Exécution des tests du backend..."
cd backend

# Vérification de la configuration
if [ ! -f ".env" ]; then
    print_warning "Fichier .env manquant, copie de l'exemple..."
    cp env.example .env
fi

# Tests Jest
print_status "Exécution des tests Jest..."
npm run test
print_success "Tests Jest réussis"

# Linting
print_status "Exécution du linting..."
npm run lint
print_success "Linting réussi"

# Build
print_status "Build de production..."
npm run build
print_success "Build réussi"

cd ..
echo ""

# Tests du frontend
print_status "Exécution des tests du frontend..."
cd frontend

# Vérification de la configuration
if [ ! -f ".env.local" ]; then
    print_warning "Fichier .env.local manquant, copie de l'exemple..."
    cp env.local.example .env.local
fi

# Linting
print_status "Exécution du linting..."
npm run lint
print_success "Linting réussi"

# Type checking
print_status "Vérification des types..."
npm run type-check
print_success "Vérification des types réussie"

# Build
print_status "Build de production..."
npm run build
print_success "Build réussi"

cd ..
echo ""

# Tests d'intégration
print_status "Exécution des tests d'intégration..."

# Vérifier que les services peuvent démarrer
print_status "Test de démarrage des services..."

# Test du backend
cd backend
timeout 10s npm run start &
BACKEND_PID=$!
sleep 5

if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend démarré avec succès"
    kill $BACKEND_PID
else
    print_error "Échec du démarrage du backend"
    exit 1
fi

cd ..

# Test du frontend
cd frontend
timeout 10s npm run start &
FRONTEND_PID=$!
sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend démarré avec succès"
    kill $FRONTEND_PID
else
    print_error "Échec du démarrage du frontend"
    exit 1
fi

cd ..

print_success "Tests d'intégration réussis"
echo ""

# Validation de la configuration
print_status "Validation de la configuration..."

# Vérifier les fichiers de configuration
CONFIG_FILES=(
    "contracts/foundry.toml"
    "backend/package.json"
    "frontend/package.json"
    "docker-compose.yml"
    "README.md"
    "DEPLOYMENT.md"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Fichier de configuration trouvé: $file"
    else
        print_error "Fichier de configuration manquant: $file"
        exit 1
    fi
done

print_success "Configuration validée"
echo ""

# Résumé des tests
print_status "Résumé des tests"
echo "=================="
print_success "✅ Tests des contrats (Foundry)"
print_success "✅ Tests du backend (Jest)"
print_success "✅ Tests du frontend (Next.js)"
print_success "✅ Linting et formatage"
print_success "✅ Build de production"
print_success "✅ Tests d'intégration"
print_success "✅ Validation de la configuration"

echo ""
print_success "🎉 Tous les tests sont passés avec succès !"
print_status "La plateforme Tokenized Asset Management est prête pour le déploiement."

echo ""
print_status "Prochaines étapes recommandées :"
echo "1. Configurer les variables d'environnement (.env files)"
echo "2. Déployer les contrats sur Sepolia"
echo "3. Configurer la base de données PostgreSQL"
echo "4. Démarrer les services en production"
echo "5. Vérifier la connectivité et les fonctionnalités"

echo ""
print_status "Pour plus d'informations, consultez :"
echo "- README.md : Documentation générale"
echo "- DEPLOYMENT.md : Guide de déploiement détaillé"
echo "- Issues GitHub : Support et questions"
