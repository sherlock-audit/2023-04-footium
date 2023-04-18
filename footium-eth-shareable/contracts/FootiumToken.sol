// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract FootiumToken is ERC20Upgradeable, OwnableUpgradeable {
    /**
     * @notice Initializes the Footium Token contract.
     */
    function initialize() external initializer {
        __ERC20_init("Rons", "RON");

        __Ownable_init();
    }

    /**
     * @notice Mints tokens.
     * @param receiver Token receiver address.
     * @param amount Amount of tokens to be minted.
     * @dev Only the owner can mint.
     */
    function mint(address receiver, uint256 amount) public onlyOwner {
        _mint(receiver, amount);
    }
}
