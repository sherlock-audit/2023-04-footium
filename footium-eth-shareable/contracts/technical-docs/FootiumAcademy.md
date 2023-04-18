# Footium Academy

## General Overview

The Footium Academy Smart Contract is used to allow Footium clubs to mint player
NFT's based on certain rules. Specifically, a club owner is only allowed to mint
players for their club. Moreover, only certain player IDs can be minted and a
player ID cannot be minted twice. When players are minted, they are sent
directly to the club's escrow account. This contract also uses `Ownable` which
allows for the number of players that can be minted in each cohort to be
changed.

## Functions

### `initialize(IFootiumPlayer footiumPlayer, IFootiumClub footiumClub, address prizeDistributorAddress, uint256 maxGenerationId, uint256[] memory fees) external initializer`

This function initialises the `FootiumAcademy` contract. The contract owner can
specify the following parameters:

- `footiumPlayer`: Footium Players contract address.
- `footiumClub`: Footium Clubs contract address.
- `prizeDistributorAddress`: `FootiumPrizeDistributor` contract address.
- `maxGenerationId`: The maximum integer `generationId` that can be used to mint
  players. This is the number of players that can be minted per cohort. At game
  launch this value will be 10.
- `fees`: Division fees. This array is a mapping from index, being the division
    tier (i.e. division 1, 2, or 3, etc), to the fee associated with minting an
    academy player in that division.

### `changeMaxGenerationId(uint256 maxGenerationId) public onlyOwner`

This function changes the `maxGenerationId` storage variable. This function can
only be executed by the owner of the contract.

### `setClubDivsMerkleRoot(bytes32 _merkleRoot) external onlyOwner`

This function changes the `_clubDivsMerkleRoot` variable. This function can only
be executed by the owner of the contract.

### `setDivisionFees(uint256[] memory _fees) public onlyOwner`

This function updates division fees. This function can only be executed by the
owner of the contract. The `fees` array are documented above.

### `changeCurrentSeasonId(uint256 _newSeasonId) external onlyOwner`

This function changes the `currentSeasonId` storage variable. This function can
only be executed by the owner of the contract. This will be manually executed at
the end of an in-game Footium season to allow the next cohort of academy players
to be minted. Academy players aren't allowed to be minted beyond their 3rd
season. As the `seasonId` increases, each academy player gets one year older.

### `activateContract() external onlyOwner`

This function unpauses the contract. This function can only be executed by the
owner of the contract.

### `pauseContract() external onlyOwner`

This function pauses the contract. This function can only be executed by the
owner of the contract.

### `mintPlayers(SeasonID seasonId, uint256 clubId, uint256 divId, uint256[] calldata generationIds, bytes32[] calldata divProof) external payable whenNotPaused nonReentrant`

This function mints players for a club based on certain rules. A club owner can
only mint players for their club. Only certain player IDs can be minted, and a
player ID cannot be minted twice. The players are sent directly to the club's
escrow account. The function parameters are as follows:

- `seasonId`: The season cohort to mint players from. Academy players can no
    longer be minted beyond their 3rd season.
- `clubId`: The ID of the club to be minting an academy player for. The caller
    of this function must own the club with this ID.
- `divId`: The ID of the division that the club belongs to.
- `generationIds`: The unique identifier of each player within the season cohort.
- `divProof`: Sibling hashes on the branch from the leaf to the division root of
  the merkel tree. This proves that the `clubId` belongs to division with
  `divId`. This makes sure that the fee being charged is correct.

### `withdraw() external onlyOwner`

This function transfers the contract available ether balance to the contact
owner address. This function can only be executed by the owner of the contract.
