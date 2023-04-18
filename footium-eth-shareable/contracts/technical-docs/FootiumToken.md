# Footium Token

## General Overview

The `FootiumToken` is a basic ERC20 token used as the primary currency in
Footium. This contract uses `Ownable` to enforce minting rights.

## Functions

### `initialize()` Initializer

This function initialises the Footium Token contract, setting the name and
symbol of the token and initialising the `Ownable` contract.

### `mint(address receiver, uint256 amount)` Access Controlled

This function mints tokens and sends them to a specified receiver address. The
amount of tokens to be minted is also specified. Only the contract owner can
mint tokens.
