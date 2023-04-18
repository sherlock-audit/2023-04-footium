# Footium Club

## General Overview

The `FootiumClub` contract is an NFT (non-fungible token) football club that
follows the ERC721 standard and uses Access Control to grant minting rights. The
main difference between the `FootiumClub` and `FootiumPlayer` contracts is that
every time a club is minted, an instance of the `FootiumEscrow` contract is
deployed. This allows clubs to have their inventory of NFT's (e.g., players) and
tokens (e.g., Footium Token).

## Functions

### `initialize(string memory baseURI) external initializer`

The `initialize` function is a contract initialiser that sets the name and symbol
of the `FootiumClub` token, initialises Access Control, `Pausable`, `ReentrancyGuard`,
and `Ownable` contracts. The function takes the `baseURI` as input parameter,
which is a string representing the base URI for metadata associated with each
token.

### `safeMint(address to, uint256 tokenId) external onlyRole(MINTER_ROLE) nonReentrant whenNotPaused`

The `safeMint` function creates a new Footium football club and mints it to the
specified address. The function takes two input parameters: `to`, which is the
address that will receive the club, and `tokenId`, which is the ID of the club
to be minted.

This function can only be called by an account with the `MINTER_ROLE` role, is
`nonReentrant`, and is only executable when the contract is not paused.
Additionally, this function deploys an instance of the `FootiumEscrow` contract
and associates it with the new club.

### `setBaseURI(string calldata baseURI) public onlyOwner`

The `setBaseURI` function sets the base metadata URI for the `FootiumClub`
token. The function takes one input parameter: `baseURI`, which is a string
representing the new base metadata URI. This function can only be called by the
contract owner.

### `activateContract() external onlyOwner`

The `activateContract` function is used to unpause the contract. This function
can only be called by the contract owner.

### `pauseContract() external onlyOwner`

The `pauseContract` function is used to pause the contract. This function can
only be called by the contract owner.

### `_baseURI() internal view override returns (string memory)`

The `_baseURI` function is an internal function that returns the base metadata
URI for the `FootiumClub` token.

### `supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool)`

The `supportsInterface` function overrides the function of the same name in both
the `ERC721Upgradeable` and `AccessControlUpgradeable` contracts. The function
checks whether the contract implements the specified interface and returns a
boolean value. This function is public and view, and it is used by the
`FootiumClub` contract to check whether it implements specific interfaces.
