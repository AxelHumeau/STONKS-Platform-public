// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title KYCRegistry
 * @dev Registry pour gérer les adresses whitelistées et blacklistées, incluant la soumission d'email pour KYC
 * @notice Ce contrat permet aux administrateurs de gérer les listes KYC
 */
contract KYCRegistry is Ownable {
    // Mappings pour stocker les statuts KYC
    mapping(address => bool) public whitelisted;
    mapping(address => bool) public blacklisted;

    // Événements pour tracker les changements
    event WhitelistUpdated(address indexed user, bool status);
    event BlacklistUpdated(address indexed user, bool status);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Ajoute une adresse à la whitelist
     * @param user Adresse à whitelister
     */
    function addWhitelist(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        whitelisted[user] = true;
        emit WhitelistUpdated(user, true);
    }

    /**
     * @dev Retire une adresse de la whitelist
     * @param user Adresse à retirer
     */
    function removeWhitelist(address user) external onlyOwner {
        whitelisted[user] = false;
        emit WhitelistUpdated(user, false);
    }

    /**
     * @dev Ajoute une adresse à la blacklist
     * @param user Adresse à blacklister
     */
    function addBlacklist(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        blacklisted[user] = true;
        emit BlacklistUpdated(user, true);
    }

    /**
     * @dev Retire une adresse de la blacklist
     * @param user Adresse à retirer
     */
    function removeBlacklist(address user) external onlyOwner {
        blacklisted[user] = false;
        emit BlacklistUpdated(user, false);
    }

    /**
     * @dev Vérifie si une adresse est autorisée (whitelistée et non blacklistée)
     * @param user Adresse à vérifier
     * @return bool True si autorisée
     */
    function isAuthorized(address user) external view returns (bool) {
        return whitelisted[user] && !blacklisted[user];
    }
}
