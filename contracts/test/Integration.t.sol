// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/KYCRegistry.sol";
import "../src/FundToken.sol";
import "../src/CertificateNFT.sol";
import "../src/Oracle.sol";
import "../src/DexIntegrationHelper.sol";

/**
 * @title IntegrationTest
 * @dev Tests d'intégration pour tous les contrats
 */
contract IntegrationTest is Test {
    KYCRegistry public kycRegistry;
    FundToken public fundToken;
    CertificateNFT public certificateNFT;
    Oracle public oracle;
    DexIntegrationHelper public dexHelper;
    
    address public owner;
    address public user1;
    address public user2;
    address public oracleSigner;
    address public uniswapRouter;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        oracleSigner = makeAddr("oracleSigner");
        uniswapRouter = makeAddr("uniswapRouter");
        
        // Déploiement des contrats
        kycRegistry = new KYCRegistry();
        fundToken = new FundToken("Fund Token", "FUND", address(kycRegistry));
        certificateNFT = new CertificateNFT("Certificate NFT", "CERT", address(kycRegistry));
        oracle = new Oracle(oracleSigner);
        dexHelper = new DexIntegrationHelper(uniswapRouter);
    }
    
    function testCompleteWorkflow() public {
        // 1. Configuration initiale
        assertEq(kycRegistry.owner(), owner);
        assertEq(fundToken.owner(), owner);
        assertEq(certificateNFT.owner(), owner);
        assertEq(oracle.owner(), owner);
        assertEq(dexHelper.owner(), owner);
        
        // 2. Ajout d'utilisateurs à la whitelist
        kycRegistry.addWhitelist(user1);
        kycRegistry.addWhitelist(user2);
        
        assertTrue(kycRegistry.isAuthorized(user1));
        assertTrue(kycRegistry.isAuthorized(user2));
        
        // 3. Mint de tokens
        uint256 tokenAmount = 1000 * 10**18;
        fundToken.mint(user1, tokenAmount);
        
        string memory metadataURI = "https://ipfs.io/ipfs/QmTest123";
        uint256 tokenId = certificateNFT.mintCertificate(user1, metadataURI);
        
        assertEq(fundToken.balanceOf(user1), tokenAmount);
        assertEq(certificateNFT.balanceOf(user1), 1);
        assertEq(certificateNFT.ownerOf(tokenId), user1);
        
        // 4. Transferts autorisés
        vm.prank(user1);
        fundToken.transfer(user2, tokenAmount / 2);
        
        vm.prank(user1);
        certificateNFT.transferFrom(user1, user2, tokenId);
        
        assertEq(fundToken.balanceOf(user2), tokenAmount / 2);
        assertEq(certificateNFT.balanceOf(user2), 1);
        assertEq(certificateNFT.ownerOf(tokenId), user2);
        
        // 5. Mise à jour de l'oracle
        uint256 price = 1000;
        uint256 timestamp = block.timestamp + 1;
        
        vm.prank(oracleSigner);
        oracle.updatePrice(price, timestamp);
        
        (uint256 currentPrice, uint256 currentTimestamp) = oracle.getPriceData();
        assertEq(currentPrice, price);
        assertEq(currentTimestamp, timestamp);
        
        // 6. Configuration DEX
        dexHelper.approveToken(address(fundToken), tokenAmount);
        assertEq(fundToken.allowance(address(dexHelper), uniswapRouter), tokenAmount);
    }
    
    function testKYCEnforcement() public {
        // Mint initial
        fundToken.mint(user1, 1000 * 10**18);
        certificateNFT.mintCertificate(user1, "https://ipfs.io/ipfs/QmTest123");
        
        // Transferts bloqués sans KYC
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        fundToken.transfer(user2, 500 * 10**18);
        
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        certificateNFT.transferFrom(user1, user2, 0);
        
        // Whitelist user1 seulement
        kycRegistry.addWhitelist(user1);
        
        // Transfert ERC20 bloqué (user2 pas whitelisté)
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        fundToken.transfer(user2, 500 * 10**18);
        
        // Transfert NFT bloqué (user2 pas whitelisté)
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        certificateNFT.transferFrom(user1, user2, 0);
        
        // Whitelist user2
        kycRegistry.addWhitelist(user2);
        
        // Transferts autorisés
        vm.prank(user1);
        fundToken.transfer(user2, 500 * 10**18);
        
        vm.prank(user1);
        certificateNFT.transferFrom(user1, user2, 0);
        
        assertEq(fundToken.balanceOf(user2), 500 * 10**18);
        assertEq(certificateNFT.ownerOf(0), user2);
    }
    
    function testBlacklistOverride() public {
        // Whitelist initial
        kycRegistry.addWhitelist(user1);
        kycRegistry.addWhitelist(user2);
        
        // Mint et transfert initial
        fundToken.mint(user1, 1000 * 10**18);
        vm.prank(user1);
        fundToken.transfer(user2, 500 * 10**18);
        
        // Blacklist user2
        kycRegistry.addBlacklist(user2);
        
        // Transferts bloqués vers user2
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        fundToken.transfer(user2, 100 * 10**18);
        
        // Retrait de la blacklist
        kycRegistry.removeBlacklist(user2);
        
        // Transfert autorisé
        vm.prank(user1);
        fundToken.transfer(user2, 100 * 10**18);
        
        assertEq(fundToken.balanceOf(user2), 600 * 10**18);
    }
    
    function testOracleAccessControl() public {
        uint256 price = 1000;
        uint256 timestamp = block.timestamp + 1;
        
        // Seul l'oracle signer peut mettre à jour
        vm.prank(user1);
        vm.expectRevert("Only oracle signer");
        oracle.updatePrice(price, timestamp);
        
        // Mise à jour autorisée
        vm.prank(oracleSigner);
        oracle.updatePrice(price, timestamp);
        
        (uint256 currentPrice, uint256 currentTimestamp) = oracle.getPriceData();
        assertEq(currentPrice, price);
        assertEq(currentTimestamp, timestamp);
        
        // Changement d'oracle signer
        address newSigner = makeAddr("newSigner");
        oracle.updateOracleSigner(newSigner);
        
        // Ancien signer ne peut plus mettre à jour
        vm.prank(oracleSigner);
        vm.expectRevert("Only oracle signer");
        oracle.updatePrice(price + 100, timestamp + 1);
        
        // Nouveau signer peut mettre à jour
        vm.prank(newSigner);
        oracle.updatePrice(price + 100, timestamp + 1);
        
        (currentPrice, currentTimestamp) = oracle.getPriceData();
        assertEq(currentPrice, price + 100);
        assertEq(currentTimestamp, timestamp + 1);
    }
    
    function testDexIntegration() public {
        uint256 amount = 1000 * 10**18;
        
        // Mint de tokens pour le helper
        fundToken.mint(address(dexHelper), amount);
        
        // Vérification du solde
        assertEq(dexHelper.getBalance(address(fundToken), address(dexHelper)), amount);
        
        // Approbation
        dexHelper.approveToken(address(fundToken), amount);
        assertEq(dexHelper.getAllowance(address(fundToken), address(dexHelper), uniswapRouter), amount);
        
        // Vérification des informations du router
        assertEq(dexHelper.getRouterInfo(), uniswapRouter);
    }
    
    function testGasOptimization() public {
        // Test de gas pour les opérations courantes
        uint256 gasStart = gasleft();
        
        kycRegistry.addWhitelist(user1);
        uint256 gasAfterWhitelist = gasleft();
        
        fundToken.mint(user1, 1000 * 10**18);
        uint256 gasAfterMint = gasleft();
        
        vm.prank(user1);
        fundToken.transfer(user2, 500 * 10**18);
        uint256 gasAfterTransfer = gasleft();
        
        // Les opérations doivent être efficaces en gas
        assertTrue(gasStart - gasAfterWhitelist < 100000);
        assertTrue(gasAfterWhitelist - gasAfterMint < 100000);
        assertTrue(gasAfterMint - gasAfterTransfer < 100000);
    }
}
