// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IFootiumPlayer} from "./interfaces/IFootiumPlayer.sol";
import {IFootiumClub} from "./interfaces/IFootiumClub.sol";

/**
 * @title Footium Club Minter contract.
 * @notice Allows the contract owner to mint a Footium club and starting squad of players.
 */
contract FootiumClubMinter is OwnableUpgradeable {
    uint256 private constant INITIAL_MINT = 20;

    IFootiumPlayer public footiumPlayer;
    IFootiumClub public footiumClub;

    /* Events */

    event InitialPlayerMinted(
        uint256 indexed clubId,
        uint256 indexed index,
        uint256 playerId
    );

    /**
     * @dev Initializes the FootiumClubMinter contract.
     * @param _footiumPlayer Footium players contract address.
     * @param _footiumClub Footium clubs contract address.
     */
    function initialize(
        IFootiumPlayer _footiumPlayer,
        IFootiumClub _footiumClub
    ) external initializer {
        __Ownable_init();

        footiumPlayer = _footiumPlayer;
        footiumClub = _footiumClub;
    }

    /**
     * @dev Updates Footium Players contract address.
     * @param _footiumPlayer Footium Players contract address.
     * @dev Only owner address allowed.
     */
    function setPlayerAddress(IFootiumPlayer _footiumPlayer)
        external
        onlyOwner
    {
        footiumPlayer = _footiumPlayer;
    }

    /**
     * @dev Updates Footium Clubs contract address.
     * @param _footiumClub Footium Clubs contract address.
     * @dev Only owner address allowed.
     */
    function setClubAddress(IFootiumClub _footiumClub) external onlyOwner {
        footiumClub = _footiumClub;
    }

    /**
     * @notice Mint a Footium club and starting squad of players.
     * @dev Only the contract owner can mint.
     * @param to The account to mint to.
     * @param tokenId The club ID to mint.
     */
    function mint(address to, uint256 tokenId) external onlyOwner {
        footiumClub.safeMint(to, tokenId);

        address escrowAddress = footiumClub.clubToEscrow(tokenId);

        for (uint256 i; i < INITIAL_MINT; ) {
            uint256 playerId = footiumPlayer.safeMint(escrowAddress);
            emit InitialPlayerMinted(tokenId, i, playerId);

            unchecked {
                i++;
            }
        }
    }
}
