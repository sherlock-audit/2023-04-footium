# Footium Payment

## General Overview

The Footium Football Player Contract is a standard ERC721 token smart contract
that represents a unique football player. It also implements the
`AccessControl`, `Ownable`, `Pausable`, `ReentrancyGuard`, and
`ERC2981Upgradeable` libraries from OpenZeppelin.

The contract allows the `FootiumAcademy` to mint players, but also allows
minting of legendary players by other accounts with specific roles.
Additionally, the contract allows the owner to change the collection's
description on marketplaces like OpenSea. The contract also implements the
ERC2981 standard for royalty payments on sales, allowing the owner of the
contract to receive a percentage of the sale.

## Functions

### `initialize(address _receiver, uint96 _royaltyFeePercentage, string memory baseURI)` Access Controlled

This function initialises the `FootiumPlayer` contract by setting the initial
parameters for the ERC2981 standard, metadata URI, and granting the
`DEFAULT_ADMIN_ROLE` to the message sender.

### `safeMint(address to)`

This function mints a new Footium Football Player NFT and assigns it to the
given address. This function can only be called by an address with the
`MINTER_ROLE`, can only be executed when the contract is not paused, and uses
the `_tokenIdCounter` variable to generate a unique ID for the new NFT.

### `_baseURI()`

This internal function returns the base metadata URI for the Footium Football
Player NFTs.

### `setBaseURI(string calldata baseURI)` Access Controlled

This function allows the contract owner to update the base metadata URI for the
Footium Football Player NFTs.

### `setRoyaltyInfo(address _receiver, uint96 _royaltyFeePercentage)` Access Controlled

This function allows the contract owner to update the royalty information for
the Footium Football Player NFTs by setting a new receiver address and royalty
fee percentage.

### `activateContract()` Access Controlled

This function allows the contract owner to unpause the contract, enabling the
ability to mint new Footium Football Player NFTs.

### `pauseContract()` Access Controlled

This function allows the contract owner to pause the contract, disabling the
ability to mint new Footium Football Player NFTs.

### `supportsInterface(bytes4 interfaceId)`

This function overrides the `supportsInterface` function from the
`ERC721Upgradeable`, `AccessControlUpgradeable`, and `ERC2981Upgradeable`
libraries to support the necessary interfaces for the Footium Football Player
Contract.
