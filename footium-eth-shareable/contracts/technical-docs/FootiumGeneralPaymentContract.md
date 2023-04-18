# Footium General Payment

## General Overview

The `FootiumGeneralPaymentContract` is a smart contract that allows club owners
to pay for future features using ETH. The contract is designed to work with the
`FootiumClub` contract and a payment receiver address. The makePayment function
is designed to be called by the owner of the club with the given ID, and the
payment amount is deducted from the sender's account and sent to the payment
receiver address. This contract inherits from OpenZeppelin's
`PausableUpgradeable`, `ReentrancyGuardUpgradeable`, and `OwnableUpgradeable`
contracts.

## Functions

### `initialize(address _paymentReceiverAddress, IFootiumClub _footiumClub)` Initialiser

The `initialize` function sets the payment receiver address (usually a treasury
or prize distributor) and the Footium club NFT contract address. It is called
only once when the contract is deployed. It uses OpenZeppelin's initializer
functions `__Pausable_init()`, `__ReentrancyGuard_init()`, and
`__Ownable_init()` to initialize the inherited contracts.

### `setPaymentReceiverAddress(address _paymentReceiverAddress)`

The `setPaymentReceiverAddress` function updates the payment receiver address,
this is typically a treasury or prize distributor. It can be called only by the
contract owner. The function emits a `PaymentReceiverUpdated` event.

### `activateContract()`

The `activateContract` function unpauses the contract. It can be called only by
the contract owner.

### `pauseContract()`

The `pauseContract` function pauses the contract. It can be called only by the
contract owner.

### `makePayment(uint256 _clubId, string calldata _message)`

The `makePayment` function allows club owners to make payments for future
features using ETH. It takes two arguments, the club ID and a message describing
the feature to pay for. The function is payable, meaning it can receive ETH.

The function checks that the sender of the payment is the owner of the club with
the given ID. It also checks that the payment amount is greater than zero. If
either of these checks fail, the function reverts with a custom error message.

The payment amount is sent to the payment receiver address using the call
function. If the payment fails, the function reverts with a custom error
message. The function emits a `PaymentMade` event which is indexed by core
Footium game engine.
