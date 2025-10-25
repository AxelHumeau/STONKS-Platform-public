// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title DexIntegrationHelper
 * @dev Helper pour l'intégration avec les DEX (Uniswap, etc.)
 * @notice Utilitaires pour les opérations de trading et de liquidité
 */
contract DexIntegrationHelper is Ownable {
    // Adresse du router Uniswap V2
    address public immutable uniswapRouter;
    
    // Événements
    event LiquidityProvided(address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB);
    event ApprovalGranted(address indexed token, address indexed spender, uint256 amount);
    
    constructor(address _uniswapRouter) Ownable(msg.sender) {
        require(_uniswapRouter != address(0), "Invalid router address");
        uniswapRouter = _uniswapRouter;
    }
    
    /**
     * @dev Approuve un montant de tokens pour le router Uniswap
     * @param token Adresse du token à approuver
     * @param amount Montant à approuver
     */
    function approveToken(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be positive");
        
        IERC20(token).approve(uniswapRouter, amount);
        emit ApprovalGranted(token, uniswapRouter, amount);
    }
    
    /**
     * @dev Fonction helper pour vérifier l'approbation
     * @param token Adresse du token
     * @param owner Propriétaire des tokens
     * @param spender Adresse approuvée
     * @return allowance Montant approuvé
     */
    function getAllowance(address token, address owner, address spender) 
        external 
        view 
        returns (uint256 allowance) 
    {
        return IERC20(token).allowance(owner, spender);
    }
    
    /**
     * @dev Fonction helper pour récupérer le solde d'un token
     * @param token Adresse du token
     * @param account Adresse du compte
     * @return balance Solde du compte
     */
    function getBalance(address token, address account) 
        external 
        view 
        returns (uint256 balance) 
    {
        return IERC20(token).balanceOf(account);
    }
    
    /**
     * @dev Fonction helper pour récupérer les informations du router
     * @return router Adresse du router
     */
    function getRouterInfo() external view returns (address router) {
        return uniswapRouter;
    }
}
