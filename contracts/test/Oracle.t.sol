// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Oracle.sol";

/**
 * @title OracleTest
 * @dev Tests pour le contrat Oracle
 */
contract OracleTest is Test {
    Oracle public oracle;
    address public owner;
    address public oracleSigner;
    address public unauthorized;
    
    function setUp() public {
        owner = address(this);
        oracleSigner = makeAddr("oracleSigner");
        unauthorized = makeAddr("unauthorized");
        
        oracle = new Oracle(oracleSigner);
    }
    
    function testInitialState() public {
        assertEq(oracle.owner(), owner);
        assertEq(oracle.oracleSigner(), oracleSigner);
        assertEq(oracle.latestPrice(), 0);
        assertEq(oracle.updatedAt(), block.timestamp);
    }
    
    function testUpdatePrice() public {
        uint256 newPrice = 1000;
        uint256 timestamp = block.timestamp + 1;
        
        vm.expectEmit(true, false, false, true);
        emit Oracle.PriceUpdated(newPrice, timestamp);
        
        vm.prank(oracleSigner);
        oracle.updatePrice(newPrice, timestamp);
        
        assertEq(oracle.latestPrice(), newPrice);
        assertEq(oracle.updatedAt(), timestamp);
    }
    
    function testUpdatePriceOnlySigner() public {
        vm.prank(unauthorized);
        vm.expectRevert("Only oracle signer");
        oracle.updatePrice(1000, block.timestamp + 1);
    }
    
    function testUpdatePriceZeroPrice() public {
        vm.prank(oracleSigner);
        vm.expectRevert("Price must be positive");
        oracle.updatePrice(0, block.timestamp + 1);
    }
    
    function testUpdatePriceInvalidTimestamp() public {
        vm.prank(oracleSigner);
        oracle.updatePrice(1000, block.timestamp + 1);
        
        vm.prank(oracleSigner);
        vm.expectRevert("Invalid timestamp");
        oracle.updatePrice(2000, block.timestamp); // timestamp antérieur
    }
    
    function testUpdateOracleSigner() public {
        address newSigner = makeAddr("newSigner");
        
        vm.expectEmit(true, true, false, true);
        emit Oracle.OracleSignerUpdated(oracleSigner, newSigner);
        
        oracle.updateOracleSigner(newSigner);
        assertEq(oracle.oracleSigner(), newSigner);
    }
    
    function testUpdateOracleSignerOnlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        oracle.updateOracleSigner(makeAddr("newSigner"));
    }
    
    function testUpdateOracleSignerInvalidAddress() public {
        vm.expectRevert("Invalid signer address");
        oracle.updateOracleSigner(address(0));
    }
    
    function testUpdateOracleSignerSameAddress() public {
        vm.expectRevert("Same signer address");
        oracle.updateOracleSigner(oracleSigner);
    }
    
    function testGetPriceData() public {
        uint256 price = 1500;
        uint256 timestamp = block.timestamp + 10;
        
        vm.prank(oracleSigner);
        oracle.updatePrice(price, timestamp);
        
        (uint256 returnedPrice, uint256 returnedTimestamp) = oracle.getPriceData();
        assertEq(returnedPrice, price);
        assertEq(returnedTimestamp, timestamp);
    }
}
