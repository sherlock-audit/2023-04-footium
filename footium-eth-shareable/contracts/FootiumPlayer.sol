// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {ERC2981Upgradeable} from "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title Footium Football Player Contract.
 * @notice An NFT football player.
 */
contract FootiumPlayer is
    ERC721Upgradeable,
    AccessControlUpgradeable,
    ERC2981Upgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    CountersUpgradeable.Counter private _tokenIdCounter;
    string private _base;

    /**
     * @notice Initializes the Footium Player contract.
     * @param _receiver The royalty receiver address.
     * @param _royaltyFeePercentage The royalty fee percentage (f.e. 500 means 5%).
     * @param baseURI Token base metadata URI.
     */
    function initialize(
        address _receiver,
        uint96 _royaltyFeePercentage,
        string memory baseURI
    ) external initializer {
        __ERC721_init("FootiumPlayer", "FFP");
        __AccessControl_init();
        __ERC2981_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();

        _base = baseURI;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setDefaultRoyalty(_receiver, _royaltyFeePercentage);
    }

    /**
     * @notice Mints a Footium football player.
     * @param to The address that will receive the player.
     * @param tokenId The ID of the club to be minted.
     * @dev Only address with `MINTER_ROLE` can mint a token.
     * @dev Can be executed when the contract is not paused.
     */
    function safeMint(address to)
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
        whenNotPaused
        returns (uint256 tokenId)
    {
        tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    /**
     * @notice Returns token base metadata URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _base;
    }

    /**
     * @notice Sets the base metadata URI.
     * @param baseURI New base metadata URI to be set.
     * @dev Only the contract owner can set a new URI.
     */
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _base = baseURI;
    }

    /**
     * @notice Updates the royalty information.
     * @param _receiver The royalty receiver address.
     * @param _royaltyFeePercentage The royalty fee percentage (f.e. 500 means 5%).
     * @dev Only owner address allowed.
     */
    function setRoyaltyInfo(address _receiver, uint96 _royaltyFeePercentage)
        external
        onlyOwner
    {
        _setDefaultRoyalty(_receiver, _royaltyFeePercentage);
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

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(
            ERC721Upgradeable,
            AccessControlUpgradeable,
            ERC2981Upgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
