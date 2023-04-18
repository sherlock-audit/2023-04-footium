// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

interface IFootiumPlayer is IERC721Upgradeable {
    function safeMint(address) external returns (uint256);
}
