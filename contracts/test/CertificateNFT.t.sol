// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/KYCRegistry.sol";
import "../src/CertificateNFT.sol";

/**
 * @title CertificateNFTTest
 * @dev Tests pour le contrat CertificateNFT avec contrôle KYC
 */
contract CertificateNFTTest is Test {
    KYCRegistry public kycRegistry;
    CertificateNFT public certificateNFT;
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        kycRegistry = new KYCRegistry();
        certificateNFT = new CertificateNFT("Certificate NFT", "CERT", address(kycRegistry));
    }
    
    function testInitialState() public {
        assertEq(certificateNFT.owner(), owner);
        assertEq(certificateNFT.name(), "Certificate NFT");
        assertEq(certificateNFT.symbol(), "CERT");
        assertEq(certificateNFT.balanceOf(user1), 0);
    }
    
    function testMintCertificate() public {
        string memory metadataURI = "https://ipfs.io/ipfs/QmTest123";
        
        vm.expectEmit(true, true, false, true);
        emit CertificateNFT.CertificateMinted(user1, 0, metadataURI);
        
        uint256 tokenId = certificateNFT.mintCertificate(user1, metadataURI);
        
        assertEq(tokenId, 0);
        assertEq(certificateNFT.balanceOf(user1), 1);
        assertEq(certificateNFT.ownerOf(tokenId), user1);
        assertEq(certificateNFT.tokenURI(tokenId), metadataURI);
    }
    
    function testTransferBlockedWhenNotWhitelisted() public {
        string memory metadataURI = "https://ipfs.io/ipfs/QmTest123";
        certificateNFT.mintCertificate(user1, metadataURI);
        
        // Transfert bloqué car user2 n'est pas whitelisté
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        certificateNFT.transferFrom(user1, user2, 0);
    }
    
    function testTransferAllowedWhenWhitelisted() public {
        string memory metadataURI = "https://ipfs.io/ipfs/QmTest123";
        certificateNFT.mintCertificate(user1, metadataURI);
        
        // Whitelister les deux utilisateurs
        kycRegistry.addWhitelist(user1);
        kycRegistry.addWhitelist(user2);
        
        // Transfert autorisé
        vm.prank(user1);
        certificateNFT.transferFrom(user1, user2, 0);
        
        assertEq(certificateNFT.balanceOf(user1), 0);
        assertEq(certificateNFT.balanceOf(user2), 1);
        assertEq(certificateNFT.ownerOf(0), user2);
    }
    
    function testTransferBlockedWhenBlacklisted() public {
        string memory metadataURI = "https://ipfs.io/ipfs/QmTest123";
        certificateNFT.mintCertificate(user1, metadataURI);
        
        // Whitelister mais blacklister user2
        kycRegistry.addWhitelist(user1);
        kycRegistry.addWhitelist(user2);
        kycRegistry.addBlacklist(user2);
        
        // Transfert bloqué car user2 est blacklisté
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        certificateNFT.transferFrom(user1, user2, 0);
    }
    
    function testOnlyOwnerCanMint() public {
        vm.prank(user1);
        vm.expectRevert();
        certificateNFT.mintCertificate(user2, "https://ipfs.io/ipfs/QmTest123");
    }
    
    function testMintToZeroAddress() public {
        vm.expectRevert("Invalid address");
        certificateNFT.mintCertificate(address(0), "https://ipfs.io/ipfs/QmTest123");
    }
    
    function testMintWithEmptyMetadataURI() public {
        vm.expectRevert("Invalid metadata URI");
        certificateNFT.mintCertificate(user1, "");
    }
    
    function testIsAuthorized() public {
        assertFalse(certificateNFT.isAuthorized(user1));
        
        kycRegistry.addWhitelist(user1);
        assertTrue(certificateNFT.isAuthorized(user1));
        
        kycRegistry.addBlacklist(user1);
        assertFalse(certificateNFT.isAuthorized(user1));
    }
    
    function testMultipleMints() public {
        string memory metadataURI1 = "https://ipfs.io/ipfs/QmTest1";
        string memory metadataURI2 = "https://ipfs.io/ipfs/QmTest2";
        
        uint256 tokenId1 = certificateNFT.mintCertificate(user1, metadataURI1);
        uint256 tokenId2 = certificateNFT.mintCertificate(user1, metadataURI2);
        
        assertEq(tokenId1, 0);
        assertEq(tokenId2, 1);
        assertEq(certificateNFT.balanceOf(user1), 2);
        assertEq(certificateNFT.tokenURI(tokenId1), metadataURI1);
        assertEq(certificateNFT.tokenURI(tokenId2), metadataURI2);
    }
    
    function testSupportsInterface() public {
        // ERC721
        assertTrue(certificateNFT.supportsInterface(0x80ac58cd));
        // ERC721Metadata
        assertTrue(certificateNFT.supportsInterface(0x5b5e139f));
        // ERC165
        assertTrue(certificateNFT.supportsInterface(0x01ffc9a7));
    }
}
