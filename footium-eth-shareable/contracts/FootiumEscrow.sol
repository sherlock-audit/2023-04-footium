// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./common/Errors.sol";

/**
 * @title Footium Escrow
 * @notice An escrow contract that stores club's players and tokens.
 */
contract FootiumEscrow is ERC721Holder, IERC1271 {
    bytes4 private constant MAGICVALUE = 0x1626ba7e;

    address private immutable footiumClubAddress;
    uint256 private immutable clubId;

    event ETHReceived(address sender, uint256 amount);

    /**
     * @notice Constructs Footium Escrow contract
     * @param _footiumClubAddress The address of Footium Club contract.
     * @param _clubId Footium Club ID.
     */
    constructor(address _footiumClubAddress, uint256 _clubId) {
        footiumClubAddress = _footiumClubAddress;
        clubId = _clubId;
    }

    modifier onlyClubOwner() {
        if (msg.sender != IERC721(footiumClubAddress).ownerOf(clubId)) {
            revert NotClubOwner(clubId, msg.sender);
        }
        _;
    }

    /**
     * @notice Enables the contract to receive ETH
     * Emits a {ETHReceived} event when ETH is received.
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @notice Checks if the signature is valid.
     * @param hash The Hashed message.
     * @param signature The signature of hashed message.
     */
    function isValidSignature(bytes32 hash, bytes memory signature)
        external
        view
        returns (bytes4 magicValue)
    {
        if (
            ECDSA.recover(hash, signature) ==
            IERC721(footiumClubAddress).ownerOf(clubId)
        ) {
            return MAGICVALUE;
        }

        return 0xffffffff;
    }

    /**
     * @notice Sets approval for ERC20 tokens.
     * @param erc20Contract ERC20 contract address.
     * @param to The address of token spender.
     * @param amount Token amount to spend.
     * @dev only the club owner address allowed.
     */
    function setApprovalForERC20(
        IERC20 erc20Contract,
        address to,
        uint256 amount
    ) external onlyClubOwner {
        erc20Contract.approve(to, amount);
    }

    /**
     * @notice Sets approval for ERC721 tokens.
     * @param erc721Contract ERC721 contract address.
     * @param to The address of token spender.
     * @param approved Boolean flag indicating whether approved or not.
     * @dev only the club owner address allowed.
     */
    function setApprovalForERC721(
        IERC721 erc721Contract,
        address to,
        bool approved
    ) external onlyClubOwner {
        erc721Contract.setApprovalForAll(to, approved);
    }

    /**
     * @notice Transfers ERC20 tokens to `to` address.
     * @param erc20Contract ERC20 contract address.
     * @param to Token receiver address.
     * @param amount Token amount to transfer.
     * @dev only the club owner address allowed.
     */
    function transferERC20(
        IERC20 erc20Contract,
        address to,
        uint256 amount
    ) external onlyClubOwner {
        erc20Contract.transfer(to, amount);
    }

    /**
     * @notice Transfers ERC721 tokens to `to` address.
     * @param erc721Contract ERC721 contract address.
     * @param to Token receiver address.
     * @param tokenId Token ID to be transferred.
     * @dev only the club owner address allowed.
     */
    function transferERC721(
        IERC721 erc721Contract,
        address to,
        uint256 tokenId
    ) external onlyClubOwner {
        erc721Contract.safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @notice Transfers contract available ether balance to the club owner address
     * @dev Only club owner address allowed
     */
    function withdraw() external onlyClubOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool sent, ) = payable(msg.sender).call{value: balance}("");
            if (!sent) {
                revert FailedToSendETH(balance);
            }
        }
    }
}
