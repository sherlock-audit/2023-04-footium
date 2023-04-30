// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {ERC721Upgradeable, IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {FootiumEscrow} from "./FootiumEscrow.sol";

/**
 * @title Footium Football Club
 * @notice An NFT football club.
 */
contract FootiumClub is
    ERC721Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    /* Storage */

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string private _base;
    mapping(uint256 => FootiumEscrow) public clubToEscrow;

    /* Events */

    event EscrowDeployed(
        uint256 indexed tokenId,
        FootiumEscrow indexed escrowAddress
    );

    /**
     * @dev Initializes the FootiumClub contract.
     * @param baseURI Footium Club  token base metadata URI.
     */
    function initialize(string memory baseURI) external initializer {
        __ERC721_init("FootiumClub", "FFC");
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();

        _base = baseURI;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /** @notice Mints a Footium football club
     * @dev Only accounts with the minting role can mint new clubs.
     * @param to The address that will receive the club.
     * @param tokenId The ID of the club to be minted.
     */
    function safeMint(address to, uint256 tokenId)
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
        whenNotPaused
    {
        FootiumEscrow escrow = new FootiumEscrow(address(this), tokenId);
        clubToEscrow[tokenId] = escrow;

        _mint(to, tokenId);

        emit EscrowDeployed(tokenId, escrow);
    }

    /**
     * @notice Sets the base metadata URI.
     * @param baseURI New base metadata URI to be set.
     * @dev Only the contract owner can set a new URI.
     */
    function setBaseURI(string calldata baseURI) public onlyOwner {
        _base = baseURI;
    }

    /**
     * @notice Unpause the contract
     * @dev Only owner address allowed.
     */
    function activateContract() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Pause the contract
     * @dev Only owner address allowed.
     */
    function pauseContract() external onlyOwner {
        _pause();
    }

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
