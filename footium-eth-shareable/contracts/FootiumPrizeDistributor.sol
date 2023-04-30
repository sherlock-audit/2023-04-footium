// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {MerkleProofUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./common/Errors.sol";

error InvalidERC20MerkleProof();
error InvalidETHMerkleProof();
error InvalidAccount();

/**
 * @title Footium Prize Distributor
 * @notice Whitelisted addresses claim ETH and ERC20 tokens from this contract via a Merkle Root.
 */
contract FootiumPrizeDistributor is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    bytes32 private erc20MerkleRoot;
    bytes32 private ethMerkleRoot;
    mapping(IERC20Upgradeable => mapping(address => uint256))
        private totalERC20Claimed;
    mapping(address => uint256) private totalETHClaimed;

    event SetERC20MerkleRoot(bytes32 merkleRoot);
    event SetETHMerkleRoot(bytes32 merkleRoot);
    event ClaimERC20(
        IERC20Upgradeable indexed token,
        address indexed to,
        uint256 value
    );
    event ClaimETH(address indexed to, uint256 value);
    event ETHReceived(address sender, uint256 amount);

    /**
     * @notice Initializes the Footium Prize Distributor contract.
     */
    function initialize() external initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
    }

    /**
     * @notice Enables the contract to receive ETH
     * Emits a {ETHReceived} event when ETH is received.
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
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
     * @notice Sets the ERC20 prize claim merkle root
     * @param _merkleRoot New merkel root to be set
     * @dev Only the contract owner can set the merkle root
     * Emits a {SetERC20MerkleRoot} event.
     */
    function setERC20MerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        erc20MerkleRoot = _merkleRoot;

        emit SetERC20MerkleRoot(erc20MerkleRoot);
    }

    /**
     * @notice Sets the ETH prize claim merkle root
     * @param _merkleRoot New merkel root to be set
     * @dev Only the contract owner can set the merkle root
     * Emits a {SetETHMerkleRoot} event.
     */
    function setETHMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        ethMerkleRoot = _merkleRoot;

        emit SetETHMerkleRoot(ethMerkleRoot);
    }

    /**
     * @notice Claims ERC20 tokens from the contract
     * @param _to Prize receiver account address
     * @param _token ERC20 token contract address
     * @param _amount ERC20 token amount
     * @param _proof Merkle proof for `erc20MerkleRoot`
     * @dev The sender must provide a merkle proof for `erc20MerkleRoot`
     * Emits a {ClaimERC20} event.
     */
    function claimERC20Prize(
        address _to,
        IERC20Upgradeable _token,
        uint256 _amount,
        bytes32[] calldata _proof
    ) external whenNotPaused nonReentrant {
        if (_to != msg.sender) {
            revert InvalidAccount();
        }

        if (
            !MerkleProofUpgradeable.verify(
                _proof,
                erc20MerkleRoot,
                keccak256(abi.encodePacked(_token, _to, _amount))
            )
        ) {
            revert InvalidERC20MerkleProof();
        }

        uint256 value = _amount - totalERC20Claimed[_token][_to];

        if (value > 0) {
            totalERC20Claimed[_token][_to] += value;
            _token.transfer(_to, value);
        }

        emit ClaimERC20(_token, _to, value);
    }

    /**
     * @notice Claims ETH tokens from the contract.
     * @param _to Prize receiver account address
     * @param _amount ETH amount
     * @param _proof Merkle proof for `ethMerkleRoot`
     * @dev The sender must provide a merkle proof for `ethMerkleRoot`.
     * Emits a {ClaimETH} event.
     */
    function claimETHPrize(
        address _to,
        uint256 _amount,
        bytes32[] calldata _proof
    ) external whenNotPaused nonReentrant {
        if (_to != msg.sender) {
            revert InvalidAccount();
        }

        if (
            !MerkleProofUpgradeable.verify(
                _proof,
                ethMerkleRoot,
                keccak256(abi.encodePacked(_to, _amount))
            )
        ) {
            revert InvalidETHMerkleProof();
        }

        uint256 value = _amount - totalETHClaimed[_to];

        if (value > 0) {
            totalETHClaimed[_to] += value;

            (bool sent, ) = _to.call{value: value}("");
            if (!sent) {
                revert FailedToSendETH(value);
            }
        }

        emit ClaimETH(_to, value);
    }
}
