// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title FundToken
 * @dev Token ERC20 avec contrôle KYC intégré
 * @notice Ce token bloque les transferts pour les adresses non autorisées
 */
contract PropertyShareToken is ERC20, Ownable {
    // Référence au registre KYC
    address public immutable kycRegistry;

    // Événements
    event TokensMinted(address indexed to, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        address _kycRegistry
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(_kycRegistry != address(0), "Invalid KYC registry");
        kycRegistry = _kycRegistry;
    }

    /**
     * @dev Mint des tokens pour une adresse (admin seulement)
     * @param to Adresse destinataire
     * @param amount Montant à minter
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be positive");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 4;
    }

    /**
     * @dev Override de _update pour appliquer les contrôles KYC
     * @param from Adresse expéditeur
     * @param to Adresse destinataire
     * @param value Montant du transfert
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        // Vérifier KYC avant le transfert (sauf pour mint/burn)
        if (from != address(0) && to != address(0)) {
            require(
                _isAuthorized(from) && _isAuthorized(to),
                "KYC: Unauthorized transfer"
            );
        }

        super._update(from, to, value);
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
}
