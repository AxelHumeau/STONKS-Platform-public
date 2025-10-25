// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title NFTEscrow
 * @dev Escrow contract for secure NFT trading with buyer/seller protection
 * @notice Supports deposits, releases, disputes, and cancellations
 */
contract NFTEscrow is IERC721Receiver, ReentrancyGuard, Ownable {
    enum EscrowStatus {
        PENDING,
        FUNDED,
        COMPLETED,
        DISPUTED,
        CANCELLED
    }

    struct Escrow {
        address seller;
        address buyer;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 createdAt;
        uint256 deadline;
        EscrowStatus status;
        bool sellerApproved;
        bool buyerApproved;
    }

    /// @notice Mapping of escrow ID to Escrow struct
    mapping(uint256 => Escrow) public escrows;
    /// @notice Counter for escrow IDs
    uint256 public escrowCount;
    /// @notice Dispute resolver address
    address public disputeResolver;

    // ============ Events ============

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed seller,
        address indexed buyer,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 deadline
    );

    event EscrowFunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );
    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed seller,
        uint256 amount
    );
    event EscrowCancelled(uint256 indexed escrowId, address indexed initiator);
    event EscrowDisputed(uint256 indexed escrowId, address indexed initiator);
    event DisputeResolved(uint256 indexed escrowId, address indexed winner);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    error InvalidAddress();
    error InvalidPrice();
    error InvalidDeadline();
    error EscrowNotFound();
    error InvalidStatus();
    error Unauthorized();
    error AlreadyApproved();
    error InsufficientPayment();
    error DeadlineNotPassed();
    error TransferFailed();
    error InvalidFee();

    constructor(
        address _disputeResolver
    ) Ownable(msg.sender) {
        if (_disputeResolver == address(0)) {
            revert InvalidAddress();
        }
        disputeResolver = _disputeResolver;
    }

    /**
     * @notice Create a new NFT escrow
     * @param buyer Address of the buyer
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID of the NFT
     * @param price Price in gwei
     * @param durationDays Duration in days before deadline
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(
        address buyer,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 durationDays
    ) external nonReentrant returns (uint256) {
        if (buyer == address(0) || nftContract == address(0))
            revert InvalidAddress();
        if (price == 0) revert InvalidPrice();
        if (durationDays == 0 || durationDays > 365) revert InvalidDeadline();

        // Transfer NFT from seller to escrow
        IERC721(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        uint256 escrowId = escrowCount++;
        uint256 deadline = block.timestamp + (durationDays * 1 days);

        escrows[escrowId] = Escrow({
            seller: msg.sender,
            buyer: buyer,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            createdAt: block.timestamp,
            deadline: deadline,
            status: EscrowStatus.PENDING,
            sellerApproved: false,
            buyerApproved: false
        });

        emit EscrowCreated(
            escrowId,
            msg.sender,
            buyer,
            nftContract,
            tokenId,
            price,
            deadline
        );

        return escrowId;
    }

    /**
     * @notice Buyer funds the escrow with payment
     * @param escrowId ID of the escrow
     */
    function fundEscrow(uint256 escrowId) external payable nonReentrant {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.seller == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.PENDING) revert InvalidStatus();
        if (msg.sender != escrow.buyer) revert Unauthorized();
        if (msg.value != escrow.price) revert InsufficientPayment();
        if (block.timestamp > escrow.deadline) revert DeadlineNotPassed();

        escrow.status = EscrowStatus.FUNDED;

        emit EscrowFunded(escrowId, msg.sender, msg.value);
    }

    /**
     * @notice Seller or buyer approves release
     * @param escrowId ID of the escrow
     */
    function approveRelease(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.seller == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.FUNDED) revert InvalidStatus();

        if (msg.sender == escrow.seller) {
            if (escrow.sellerApproved) revert AlreadyApproved();
            escrow.sellerApproved = true;
        } else if (msg.sender == escrow.buyer) {
            if (escrow.buyerApproved) revert AlreadyApproved();
            escrow.buyerApproved = true;
        } else {
            revert Unauthorized();
        }

        // If both approved, release automatically
        if (escrow.sellerApproved && escrow.buyerApproved) {
            _releaseEscrow(escrowId);
        }
    }

    /**
     * @notice Release escrow (called automatically when both parties approve)
     * @param escrowId ID of the escrow
     */
    function releaseEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.seller == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.FUNDED) revert InvalidStatus();
        if (!escrow.sellerApproved || !escrow.buyerApproved)
            revert Unauthorized();

        _releaseEscrow(escrowId);
    }

    /**
     * @notice Cancel escrow and refund
     * @param escrowId ID of the escrow
     */
    function cancelEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.seller == address(0)) revert EscrowNotFound();

        // Only allow cancellation in certain conditions
        bool canCancel = false;

        if (escrow.status == EscrowStatus.PENDING) {
            // Before funding: only seller can cancel
            canCancel = (msg.sender == escrow.seller);
        } else if (escrow.status == EscrowStatus.FUNDED) {
            // After funding: mutual agreement OR deadline passed
            canCancel = ((msg.sender == escrow.seller ||
                msg.sender == escrow.buyer) &&
                block.timestamp > escrow.deadline);
        }

        if (!canCancel) revert Unauthorized();

        escrow.status = EscrowStatus.CANCELLED;

        // Return NFT to seller
        IERC721(escrow.nftContract).safeTransferFrom(
            address(this),
            escrow.seller,
            escrow.tokenId
        );

        // Return funds to buyer if funded
        if (escrow.status == EscrowStatus.FUNDED) {
            (bool success, ) = escrow.buyer.call{value: escrow.price}("");
            if (!success) revert TransferFailed();
        }

        emit EscrowCancelled(escrowId, msg.sender);
    }

    /**
     * @notice Raise a dispute
     * @param escrowId ID of the escrow
     */
    function raiseDispute(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];

        if (escrow.seller == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.FUNDED) revert InvalidStatus();
        if (msg.sender != escrow.seller && msg.sender != escrow.buyer)
            revert Unauthorized();

        escrow.status = EscrowStatus.DISPUTED;

        emit EscrowDisputed(escrowId, msg.sender);
    }

    /**
     * @notice Resolve dispute (dispute resolver only)
     * @param escrowId ID of the escrow
     * @param favorBuyer True if ruling in favor of buyer, false for seller
     */
    function resolveDispute(
        uint256 escrowId,
        bool favorBuyer
    ) external nonReentrant {
        if (msg.sender != disputeResolver) revert Unauthorized();

        Escrow storage escrow = escrows[escrowId];

        if (escrow.seller == address(0)) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.DISPUTED) revert InvalidStatus();

        if (favorBuyer) {
            escrow.status = EscrowStatus.CANCELLED;

            IERC721(escrow.nftContract).safeTransferFrom(
                address(this),
                escrow.seller,
                escrow.tokenId
            );

            (bool success, ) = escrow.buyer.call{value: escrow.price}("");
            if (!success) revert TransferFailed();

            emit DisputeResolved(escrowId, escrow.buyer);
        } else {
            // Release to seller
            escrow.status = EscrowStatus.COMPLETED;
            _releaseEscrow(escrowId);
            emit DisputeResolved(escrowId, escrow.seller);
        }
    }

    /**
     * @notice Get escrow details
     */
    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    /**
     * @notice Update dispute resolver (owner only)
     */
    function setDisputeResolver(address newResolver) external onlyOwner {
        if (newResolver == address(0)) revert InvalidAddress();
        disputeResolver = newResolver;
    }

    /**
     * @dev Internal function to release escrow
     */
    function _releaseEscrow(uint256 escrowId) internal {
        Escrow storage escrow = escrows[escrowId];

        escrow.status = EscrowStatus.COMPLETED;

        uint256 sellerAmount = escrow.price;

        IERC721(escrow.nftContract).safeTransferFrom(
            address(this),
            escrow.buyer,
            escrow.tokenId
        );

        (bool successSeller, ) = escrow.seller.call{value: sellerAmount}("");
        if (!successSeller) revert TransferFailed();

        emit EscrowReleased(escrowId, escrow.seller, sellerAmount);
    }

    /**
     * @dev Required to receive NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
