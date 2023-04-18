# Footium Prize Distributor

## General Overview

The Footium Prize Distributor is a smart contract that underpins the P2E part of
Footium, allowing declaration on-chain of how many total tokens each player has
been owed, based on their in-game performance. The contract uses a Merkle root
to compress the long list of players into a small digest, greatly decreasing gas
costs. To claim tokens, users must indicate how many and which type of tokens
they are owed, as well as a Merkle proof that their prize is indeed in the
Merkle tree. The smart contract keeps track of how many of each token has been
claimed. The idea behind the Merkle tree containing the user's total ever owed
prizes is to prevent race conditions. There are separate Merkle roots for both
ETH and ERC20 prizes.

## Functions

### `initialize()` Initializer

This function initializes the Footium Prize Distributor contract.

### `receive()`

This function enables the contract to receive ETH and emits an `ETHReceived`
event when ETH is received.

### `activateContract()` Access Controlled

This function unpauses the contract and can only be called by the contract
owner.

### `pauseContract()` Access Controlled

This function pauses the contract and can only be called by the contract owner.

### `setERC20MerkleRoot(bytes32 _merkleRoot)` Access Controlled

This function sets the ERC20 prize claim Merkle root and can only be called by
the contract owner. It emits a `SetERC20MerkleRoot` event. When prizes have been
issued at the end of the season, this function will be manually called after the
Merkle tree has been verified.

### `setETHMerkleRoot(bytes32 _merkleRoot)` Access Controlled

This function sets the ETH prize claim Merkle root and can only be called by the
contract owner. It emits a `SetETHMerkleRoot` event. When prizes have been
issued at the end of the season, this function will be manually called after the
Merkle tree has been verified.

### `claimERC20Prize(address _to, IERC20Upgradeable _token, uint256 _amount, bytes32[] calldata _proof)`

This function allows the claim of ERC20 tokens from the contract. The user must
provide a Merkle proof for `erc20MerkleRoot`. The function checks to see whether
the function caller owns the club that they're claiming prizes for. If
successful, the function transfers ERC20 tokens to the prize receiver account
address and emits a `ClaimERC20` event. The `ClaimERC20` event is indexed by the
`footium-node` indexer.

### `claimETHPrize(address _to, uint256 _amount, bytes32[] calldata _proof)`

This function allows the claim of ETH tokens from the contract. The user must
provide a Merkle proof for `ethMerkleRoot`. The function checks to see whether
the function caller owns the club that they're claiming prizes for. If
successful, the function transfers ETH to the prize receiver account address and
emits a `ClaimETH` event. The `ClaimETH` event is indexed by the `footium-node`
indexer.
