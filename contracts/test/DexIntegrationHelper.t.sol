// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/DexIntegrationHelper.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DexIntegrationHelperTest
 * @dev Tests pour le contrat DexIntegrationHelper
 */
contract DexIntegrationHelperTest is Test {
    DexIntegrationHelper public dexHelper;
    MockERC20 public mockToken;
    address public owner;
    address public user1;
    address public uniswapRouter;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        uniswapRouter = makeAddr("uniswapRouter");
        
        dexHelper = new DexIntegrationHelper(uniswapRouter);
        mockToken = new MockERC20("Mock Token", "MOCK");
    }
    
    function testInitialState() public {
        assertEq(dexHelper.owner(), owner);
        assertEq(dexHelper.uniswapRouter(), uniswapRouter);
    }
    
    function testApproveToken() public {
        uint256 amount = 1000 * 10**18;
        
        vm.expectEmit(true, true, false, true);
        emit DexIntegrationHelper.ApprovalGranted(address(mockToken), uniswapRouter, amount);
        
        dexHelper.approveToken(address(mockToken), amount);
        
        assertEq(mockToken.allowance(address(dexHelper), uniswapRouter), amount);
    }
    
    function testGetAllowance() public {
        uint256 amount = 1000 * 10**18;
        
        // Pas d'approbation initiale
        assertEq(dexHelper.getAllowance(address(mockToken), address(dexHelper), uniswapRouter), 0);
        
        // Après approbation
        dexHelper.approveToken(address(mockToken), amount);
        assertEq(dexHelper.getAllowance(address(mockToken), address(dexHelper), uniswapRouter), amount);
    }
    
    function testGetBalance() public {
        uint256 amount = 1000 * 10**18;
        
        // Solde initial
        assertEq(dexHelper.getBalance(address(mockToken), address(dexHelper)), 0);
        
        // Après mint
        mockToken.mint(address(dexHelper), amount);
        assertEq(dexHelper.getBalance(address(mockToken), address(dexHelper)), amount);
    }
    
    function testGetRouterInfo() public {
        assertEq(dexHelper.getRouterInfo(), uniswapRouter);
    }
    
    function testOnlyOwnerCanApprove() public {
        vm.prank(user1);
        vm.expectRevert();
        dexHelper.approveToken(address(mockToken), 1000 * 10**18);
    }
    
    function testApproveTokenZeroAddress() public {
        vm.expectRevert("Invalid token address");
        dexHelper.approveToken(address(0), 1000 * 10**18);
    }
    
    function testApproveTokenZeroAmount() public {
        vm.expectRevert("Amount must be positive");
        dexHelper.approveToken(address(mockToken), 0);
    }
    
    function testMultipleApprovals() public {
        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 2000 * 10**18;
        
        dexHelper.approveToken(address(mockToken), amount1);
        assertEq(mockToken.allowance(address(dexHelper), uniswapRouter), amount1);
        
        dexHelper.approveToken(address(mockToken), amount2);
        assertEq(mockToken.allowance(address(dexHelper), uniswapRouter), amount2);
    }
}

/**
 * @title MockERC20
 * @dev Token ERC20 mock pour les tests
 */
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
