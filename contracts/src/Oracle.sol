// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title Oracle
 * @dev Oracle pour stocker et mettre à jour les prix des actifs
 * @notice Seule l'adresse oracle signer peut mettre à jour les prix
 */
contract Oracle is Ownable {
    uint256 public latestPrice;
    uint256 public updatedAt;

    address public oracleSigner;

    event PriceUpdated(uint256 indexed price, uint256 timestamp);
    event OracleSignerUpdated(
        address indexed oldSigner,
        address indexed newSigner
    );

    constructor(address _oracleSigner) Ownable(msg.sender) {
        require(_oracleSigner != address(0), "Invalid oracle signer");
        oracleSigner = _oracleSigner;
        latestPrice = 0;
        updatedAt = block.timestamp;
    }

    /**
     * @dev Met à jour le prix (oracle signer seulement)
     * @param price Nouveau prix
     * @param timestamp Timestamp de la mise à jour
     */
    function updatePrice(uint256 price, uint256 timestamp) external {
        require(msg.sender == oracleSigner, "Only oracle signer");
        require(price > 0, "Price must be positive");
        require(timestamp > updatedAt, "Invalid timestamp");

        latestPrice = price;
        updatedAt = timestamp;

        emit PriceUpdated(price, timestamp);
    }

    /**
     * @dev Met à jour l'adresse oracle signer (owner seulement)
     * @param newSigner Nouvelle adresse signer
     */
    function updateOracleSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer address");
        require(newSigner != oracleSigner, "Same signer address");

        address oldSigner = oracleSigner;
        oracleSigner = newSigner;

        emit OracleSignerUpdated(oldSigner, newSigner);
    }

    /**
     * @dev Récupère les données de prix actuelles
     * @return price Prix actuel
     * @return timestamp Timestamp de dernière mise à jour
     */
    function getPriceData()
        external
        view
        returns (uint256 price, uint256 timestamp)
    {
        return (latestPrice, updatedAt);
    }
}
