// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/KYCRegistry.sol";

/**
 * @title KYCRegistryTest
 * @dev Tests pour le contrat KYCRegistry
 */
contract KYCRegistryTest is Test {
    KYCRegistry public kycRegistry;
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        kycRegistry = new KYCRegistry();
    }
    
    function testInitialState() public {
        assertEq(kycRegistry.owner(), owner);
        assertFalse(kycRegistry.whitelisted(user1));
        assertFalse(kycRegistry.blacklisted(user1));
    }
    
    function testAddWhitelist() public {
        vm.expectEmit(true, false, false, true);
        emit KYCRegistry.WhitelistUpdated(user1, true);
        
        kycRegistry.addWhitelist(user1);
        assertTrue(kycRegistry.whitelisted(user1));
        assertTrue(kycRegistry.isAuthorized(user1));
    }
    
    function testRemoveWhitelist() public {
        kycRegistry.addWhitelist(user1);
        assertTrue(kycRegistry.whitelisted(user1));
        
        vm.expectEmit(true, false, false, true);
        emit KYCRegistry.WhitelistUpdated(user1, false);
        
        kycRegistry.removeWhitelist(user1);
        assertFalse(kycRegistry.whitelisted(user1));
        assertFalse(kycRegistry.isAuthorized(user1));
    }
    
    function testAddBlacklist() public {
        vm.expectEmit(true, false, false, true);
        emit KYCRegistry.BlacklistUpdated(user1, true);
        
        kycRegistry.addBlacklist(user1);
        assertTrue(kycRegistry.blacklisted(user1));
        assertFalse(kycRegistry.isAuthorized(user1));
    }
    
    function testRemoveBlacklist() public {
        kycRegistry.addBlacklist(user1);
        assertTrue(kycRegistry.blacklisted(user1));
        
        vm.expectEmit(true, false, false, true);
        emit KYCRegistry.BlacklistUpdated(user1, false);
        
        kycRegistry.removeBlacklist(user1);
        assertFalse(kycRegistry.blacklisted(user1));
        assertFalse(kycRegistry.isAuthorized(user1));
    }
    
    function testBlacklistOverridesWhitelist() public {
        kycRegistry.addWhitelist(user1);
        assertTrue(kycRegistry.isAuthorized(user1));
        
        kycRegistry.addBlacklist(user1);
        assertFalse(kycRegistry.isAuthorized(user1));
    }
    
    function testOnlyOwnerCanModify() public {
        vm.prank(user1);
        vm.expectRevert();
        kycRegistry.addWhitelist(user2);
        
        vm.prank(user1);
        vm.expectRevert();
        kycRegistry.addBlacklist(user2);
    }
    
    function testInvalidAddress() public {
        vm.expectRevert("Invalid address");
        kycRegistry.addWhitelist(address(0));
        
        vm.expectRevert("Invalid address");
        kycRegistry.addBlacklist(address(0));
    }
}
