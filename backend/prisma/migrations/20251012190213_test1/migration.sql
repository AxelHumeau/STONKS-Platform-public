-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('ERC20', 'ERC721');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isWhitelisted" BOOLEAN NOT NULL DEFAULT false,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalSupply" BIGINT NOT NULL DEFAULT 0,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_events" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "tokenId" TEXT,
    "amount" BIGINT,
    "blockNumber" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oracle_prices" (
    "id" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oracle_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidity_pools" (
    "id" TEXT NOT NULL,
    "pairAddress" TEXT NOT NULL,
    "tokenA" TEXT NOT NULL,
    "tokenB" TEXT NOT NULL,
    "liquidity" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidity_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_events" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_address_key" ON "users"("address");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_contractAddress_key" ON "tokens"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_events_txHash_logIndex_key" ON "transfer_events"("txHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "liquidity_pools_pairAddress_key" ON "liquidity_pools"("pairAddress");

-- AddForeignKey
ALTER TABLE "transfer_events" ADD CONSTRAINT "transfer_events_fromAddress_fkey" FOREIGN KEY ("fromAddress") REFERENCES "users"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_events" ADD CONSTRAINT "transfer_events_toAddress_fkey" FOREIGN KEY ("toAddress") REFERENCES "users"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_events" ADD CONSTRAINT "transfer_events_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "tokens"("contractAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
