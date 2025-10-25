// src/FundToken.sol (FIXED)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title FundToken
 * @dev ERC20 token with KYC checks via an external registry
 */
contract FundToken is ERC20, Ownable {
    address public immutable kycRegistry;
    event TokensMinted(address indexed to, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        address _kycRegistry
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(_kycRegistry != address(0), "Invalid KYC registry");
        kycRegistry = _kycRegistry;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be positive");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @dev Override of _update to apply KYC checks.
     */
    function _update(  // <-- MUST BE _update
        address from,
        address to,
        uint256 value
    ) internal override {
        // Only check KYC if it's a transfer between two non-zero addresses (not mint/burn)
        if (from != address(0) && to != address(0)) {
            require(
                _isAuthorized(from) && _isAuthorized(to),
                "KYC: Unauthorized transfer"
            );
        }

        super._update(from, to, value);
    }

    function _isAuthorized(address user) internal view returns (bool) {
        (bool success, bytes memory data) = kycRegistry.staticcall(
            abi.encodeWithSignature("isAuthorized(address)", user)
        );
        if (success && data.length >= 32) {
            return abi.decode(data, (bool));
        }
        return false;
    }

    function isAuthorized(address user) external view returns (bool) {
        return _isAuthorized(user);
    }
}
