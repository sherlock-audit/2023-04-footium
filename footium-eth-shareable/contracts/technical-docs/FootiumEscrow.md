# Footium Escrow

## General Overview

The `FootiumEscrow` is an escrow contract that stores `FootiumClub`'s players
and tokens. This contract is designed to facilitate the transfer of ERC20 and
ERC721 tokens in and out of the escrow account. The contract owner, which is the
owner of the `FootiumClub` NFT, is the only address that is authorised to
perform any of the transfer functions. Additionally, the contract has
implemented the `isValidSignature` function from the `IERC1271` interface to
allow for the verification of signatures.

## Functions

### `constructor(_footiumClubAddress, _clubId)`

This function is the constructor for the FootiumEscrow contract. It takes two
parameters, `_footiumClubAddress` which is the address of the `FootiumClub`
contract, and `_clubId` which is the ID of the `FootiumClub` NFT that the escrow
is associated with.

### `onlyClubOwner()`

This is a modifier function that ensures only the club owner can access
functions that are restricted to club owners. This modifier checks that the
caller of the function is the owner of the `FootiumClub` NFT associated with the
escrow.

### `receive() external payable`

This function enables the contract to receive ETH. When called, it emits an
`ETHReceived` event.

### `isValidSignature(hash, signature) external view returns (magicValue)`

This function checks whether a signature is valid. It takes two parameters, hash
which is the hashed message, and signature which is the signature of the hashed
message. If the recovered address from the `ECDSA.recover` function matches the
owner of the `FootiumClub` NFT associated with the escrow, then the function
returns the `MAGICVALUE` constant. Otherwise, it returns a value indicating an
invalid signature.

This is used to interact with third party protocols such as the Rarible
protocol. In this situation we want to list players for sale on behalf of a
club.

### `setApprovalForERC20(erc20Contract, to, amount) external onlyClubOwner`

This function sets approval for ERC20 tokens to a specified spender. It takes
three parameters, `erc20Contract` which is the address of the ERC20 contract,
`to` which is the address of the token spender, and `amount` which is the amount
of tokens to approve. This function can only be called by the owner of the
`FootiumClub` NFT associated with the escrow.

### `setApprovalForERC721(erc721Contract, to, approved) external onlyClubOwner`

This function sets approval for ERC721 tokens to a specified spender. It takes
three parameters, `erc721Contract` which is the address of the ERC721 contract,
`to` which is the address of the token spender, and `approved` which is a
boolean flag indicating whether the spender is approved or not. This function
can only be called by the owner of the `FootiumClub` NFT associated with the
escrow.

### `transferERC20(erc20Contract, to, amount) external onlyClubOwner`

This function transfers ERC20 tokens to a specified address. It takes three
parameters, `erc20Contract` which is the address of the ERC20 contract, `to`
which is the address of the token receiver, and `amount` which is the amount of
tokens to transfer. This function can only be called by the owner of the
`FootiumClub` NFT associated with the escrow.

### `transferERC721(erc721Contract, to, tokenId) external onlyClubOwner`

This function transfers ERC721 tokens to a specified address. It takes three
parameters, `erc721Contract` which is the address of the ERC721 contract, `to`
which is the address of the token receiver, and `amount` which is the amount of
tokens to transfer. This function can only be called by the owner of the
`FootiumClub` NFT associated with the escrow.
