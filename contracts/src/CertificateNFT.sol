// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ERC721URIStorage} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title CertificateNFT
 * @dev NFT ERC721 avec contrôle KYC intégré pour les certificats
 * @notice Ce NFT bloque les transferts pour les adresses non autorisées
 */
contract CertificateNFT is ERC721, ERC721URIStorage, Ownable {
    address public immutable kycRegistry;
    uint256 private _nextTokenId;

    event CertificateMinted(
        address indexed to,
        uint256 tokenId,
        string metadataURI
    );

    constructor(
        string memory name,
        string memory symbol,
        address _kycRegistry
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_kycRegistry != address(0), "Invalid KYC registry");
        kycRegistry = _kycRegistry;
    }

    /**
     * @dev Mint un certificat NFT pour une adresse (admin seulement)
     * @param to Adresse destinataire
     * @param metadataURI URI des métadonnées
     * @return tokenId ID du token minté
     */
    function mintCertificate(
        address to,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");
        require(bytes(metadataURI).length > 0, "Invalid metadata URI");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit CertificateMinted(to, tokenId, metadataURI);
        return tokenId;
    }

    /**
     * @dev Override de _update pour appliquer les contrôles KYC
     * @param to Adresse destinataire
     * @param tokenId ID du token
     * @param auth Adresse autorisée
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        if (auth != address(0) && to != address(0)) {
            require(
                _isAuthorized(auth) && _isAuthorized(to),
                "KYC: Unauthorized transfer"
            );
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Vérifie si une adresse est autorisée via le registre KYC
     * @param user Adresse à vérifier
     * @return bool True si autorisée
     */
    function _isAuthorized(address user) internal view returns (bool) {
        (bool success, bytes memory data) = kycRegistry.staticcall(
            abi.encodeWithSignature("isAuthorized(address)", user)
        );

        if (success && data.length >= 32) {
            return abi.decode(data, (bool));
        }

        return false;
    }

    /**
     * @dev Fonction publique pour vérifier l'autorisation KYC
     * @param user Adresse à vérifier
     * @return bool True si autorisée
     */
    function isAuthorized(address user) external view returns (bool) {
        return _isAuthorized(user);
    }

    /**
     * @dev Override pour supporter ERC721URIStorage
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override pour supporter ERC721URIStorage
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
