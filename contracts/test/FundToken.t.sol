// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/KYCRegistry.sol";
import "../src/FundToken.sol";

/**
 * @title FundTokenTest
 * @dev Tests pour le contrat FundToken avec contrôle KYC
 */
contract FundTokenTest is Test {
    KYCRegistry public kycRegistry;
    FundToken public fundToken;
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
        fundToken = new FundToken("Fund Token", "FUND", address(kycRegistry));
    }
    
    function testInitialState() public {
        assertEq(fundToken.owner(), owner);
        assertEq(fundToken.name(), "Fund Token");
        assertEq(fundToken.symbol(), "FUND");
        assertEq(fundToken.decimals(), 18);
        assertEq(fundToken.totalSupply(), 0);
    }
    
    function testMint() public {
        uint256 amount = 1000 * 10**18;
        
        vm.expectEmit(true, false, false, true);
        emit FundToken.TokensMinted(user1, amount);
        
        fundToken.mint(user1, amount);
        assertEq(fundToken.balanceOf(user1), amount);
        assertEq(fundToken.totalSupply(), amount);
    }
    
    function testTransferBlockedWhenNotWhitelisted() public {
        uint256 amount = 1000 * 10**18;
        fundToken.mint(user1, amount);
        
        // Transfert bloqué car user2 n'est pas whitelisté
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        fundToken.transfer(user2, amount);
    }
    
    function testTransferAllowedWhenWhitelisted() public {
        uint256 amount = 1000 * 10**18;
        fundToken.mint(user1, amount);
        
        // Whitelister les deux utilisateurs
        kycRegistry.addWhitelist(user1);
        kycRegistry.addWhitelist(user2);
        
        // Transfert autorisé
        vm.prank(user1);
        fundToken.transfer(user2, amount);
        
        assertEq(fundToken.balanceOf(user1), 0);
        assertEq(fundToken.balanceOf(user2), amount);
    }
    
    function testTransferBlockedWhenBlacklisted() public {
        uint256 amount = 1000 * 10**18;
        fundToken.mint(user1, amount);
        
        // Whitelister mais blacklister user2
        kycRegistry.addWhitelist(user1);
        kycRegistry.addWhitelist(user2);
        kycRegistry.addBlacklist(user2);
        
        // Transfert bloqué car user2 est blacklisté
        vm.prank(user1);
        vm.expectRevert("KYC: Unauthorized transfer");
        fundToken.transfer(user2, amount);
    }
    
    function testOnlyOwnerCanMint() public {
        vm.prank(user1);
        vm.expectRevert();
        fundToken.mint(user2, 1000 * 10**18);
    }
    
    function testMintToZeroAddress() public {
        vm.expectRevert("Invalid address");
        fundToken.mint(address(0), 1000 * 10**18);
    }
    
    function testMintZeroAmount() public {
        vm.expectRevert("Amount must be positive");
        fundToken.mint(user1, 0);
    }
    
    function testIsAuthorized() public {
        assertFalse(fundToken.isAuthorized(user1));
        
        kycRegistry.addWhitelist(user1);
        assertTrue(fundToken.isAuthorized(user1));
        
        kycRegistry.addBlacklist(user1);
        assertFalse(fundToken.isAuthorized(user1));
    }
}
