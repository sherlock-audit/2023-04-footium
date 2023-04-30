# Footium Club Minter

## General Overview

The Footium Club Minter is a smart contract responsible for minting
`FootiumClub` NFT's and initialising an initial squad of players. This contract
provides a structured way to create new Footium clubs with initial players by
minting NFTs in an escrow account that is linked to the club.

## Functions

### `initialize(_footiumPlayer, _footiumClub) external initializer`

This function initialises the `FootiumClubMinter` contract with the
`FootiumPlayers` contract address and `FootiumClubs` contract address. Only the
contract owner can initialise this function.

### `setPlayerAddress(_footiumPlayer) external onlyOwner`

This function updates the `FootiumPlayers` contract address. Only the contract
owner can update this address.

### `setClubAddress(_footiumClub) external onlyOwner`

This function updates the `FootiumClubs` contract address. Only the contract
owner can update this address.

### `mint(to, tokenId) external onlyOwner`

The mint function is responsible for creating a new `FootiumClub` NFT with an
initial squad of players. This function is only accessible by the contract
owner.

When called, the function first uses the `safeMint` function from the
`IFootiumClub` interface to create a new `FootiumClub` NFT with the provided
`tokenId` and mints it to the specified to address. This ensures that the
`FootiumClub` NFT is safely minted to the intended address.

Next, the function retrieves the escrow address linked to the newly minted
`FootiumClub` by calling the `clubToEscrow` function from the `IFootiumClub`
interface. This escrow address is used to mint the initial squad of players.

The function then enters a loop to mint the initial players. The loop iterates
`INITIAL_MINT` times (which is set to 20 in the contract) and calls the `safeMint`
function from the `IFootiumPlayer` interface for each iteration. The `safeMint`
function mints a new `FootiumPlayer` NFT to the escrow address retrieved earlier.
The `playerId` returned by the `safeMint` function is emitted as an
`InitialPlayerMinted` event. `InitialPlayerMinted` is eventually indexed by the
core Footium engine.
