# 📄 Project Alignment Document – Tokenized Asset Management Platform

**Objectif :** Garder une trace claire de nos décisions techniques et de notre compréhension des consignes du sujet Epitech, afin d’éviter les malentendus pendant le développement.

---

## ✅ 1. Blockchain Choice

- **Choix retenu :** Any **EVM-compatible blockchain** (ex: Ethereum Sepolia Testnet)
- **Justification :**
  - L’équipe possède **plus d’expérience en Solidity / EVM**
  - Permet de **gagner du temps sur l’implémentation**
  - Évite une **complexification inutile** en changeant d’écosystème (XRPL)

---

## ✅ 2. Tokenization Model – Real Estate as RWA

| Type de token | Utilisation | Exemple concret |
|---------------|-------------|------------------|
| **Fungible Token (ERC-20)** | Fractional ownership d’un bien immobilier | Un appartement divisé en X parts → chaque part = 1 token détenu par différents copropriétaires |
| **Non-Fungible Token (ERC-721)** | Propriété unique et entière | 1 NFT = 1 appartement possédé à 100 % par une seule personne |

> **Exemple illustratif :**  
> Immeuble avec 5 appartements →  
> • 4 possédés individuellement → 4 NFTs  
> • 1 partagé entre plusieurs propriétaires → 1 ERC-20 divisible

---

## ✅ 3. Compliance – KYC, Whitelist & Blacklist

- **KYC obligatoire** pour accéder à la plateforme
- **Whitelist = droits d’accès & possession**
- **Blacklist = révocation forcée**, même après KYC
- **Règles de compliance enforce *on-chain*** (pas uniquement côté frontend)

---

## ✅ 4. Trading & Liquidity

- Nos tokens doivent être **tradables sur un DEX (Uniswap)**
- Création d’une **Liquidity Pool** (ex: `TOKEN / ETH`)
- Un utilisateur doit pouvoir **placer librement une partie de ses tokens dans la pool**

---

## ✅ 5. Indexer & Real-Time Blockchain Awareness

- Le frontend doit **refléter l’état réel de la blockchain**
- Si un swap ou une liquidity action est faite **directement sur le DEX**, notre app doit **le détecter**
- Implémentation d’un **indexer (cron every X minutes)** qui :
  - Récupère les **swaps, transferts, add/remove liquidity**
  - Les **sync dans la base ou le frontend**

---

## ✅ 6. Oracle & Pricing

- Capacité à **comparer la valeur du bien tokenisé** :
  - **Valeur totale des tokens en circulation (market cap)** VS **Valeur estimée via Oracle**
- Oracle utilisable : **Chainlink** ou **mock si besoin**

---

## ❓ IA Comment – Points à Clarifier

| Sujet flou | Question à trancher | Risque si non défini |
|-------------|--------------------|------------------------|
| **Type de bien immobilier exact** | On choisit quel bien ? Réel ou fictif ? | Impacte storytelling devant le jury |
| **Système KYC** | Vérification manuelle ou service externe ? | Définit la complexité backend |
| **Effet de la blacklist** | Freeze ? Transfert forcé ? Blocage de transfert ? | Impacte la logique Smart Contract |
| **Architecture des contrats** | 1 contrat global multi-biens ou 1 contrat / bien ? | Impacte maintenance et déploiement |
| **Oracle en EUR, USD ou ETH ?** | Quelle unité de valeur ? | Problème de cohérence d’affichage |
| **UI minimale ou soignée ?** | On fait juste fonctionnel ou joli ? | Répartition du travail frontend/backend |

---

## ✅ Next Step

**→ Valider les points de la section *IA Comment* avant de coder.**

