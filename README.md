
# Footium contest details

- Join [Sherlock Discord](https://discord.gg/MABEWyASkp)
- Submit findings using the issue page in your private contest repo (label issues as med or high)
- [Read for more details](https://docs.sherlock.xyz/audits/watsons)

# Q&A

### Q: On what chains are the smart contracts going to be deployed?
Arbitrum
___

### Q: Which ERC20 tokens do you expect will interact with the smart contracts? 
Any
___

### Q: Which ERC721 tokens do you expect will interact with the smart contracts? 
Any
___

### Q: Which ERC777 tokens do you expect will interact with the smart contracts? 
None
___

### Q: Are there any FEE-ON-TRANSFER tokens interacting with the smart contracts?

None
___

### Q: Are there any REBASING tokens interacting with the smart contracts?

None
___

### Q: Are the admins of the protocols your contracts integrate with (if any) TRUSTED or RESTRICTED?
TRUSTED
___

### Q: Is the admin/owner of the protocol/contracts TRUSTED or RESTRICTED?
TRUSTED
___

### Q: Are there any additional protocol roles? If yes, please explain in detail:
N/A
___

### Q: Is the code/contract expected to comply with any EIPs? Are there specific assumptions around adhering to those EIPs that Watsons should be aware of?
The FootiumEscrow contract complies with the EIP-1271 (Standard Signature Validation Method for Contracts) standard, the purpose is for each club to have its own FootiumEscrow contract deployed, each contract can create a signature for OpenSea to buy or sell FootiumPlayer NFTs
___

### Q: Please list any known issues/acceptable risks that should not result in a valid finding.
N/A
___

### Q: Please provide links to previous audits (if any).
No previous audits
___

### Q: Are there any off-chain mechanisms or off-chain procedures for the protocol (keeper bots, input validation expectations, etc)?
Creation of the club-division merkle root, prize distribution merkle root are created off chain
___

### Q: In case of external protocol integrations, are the risks of external contracts pausing or executing an emergency withdrawal acceptable? If not, Watsons will submit issues related to these situations that can harm your protocol's functionality.
Yes it's acceptable
___



# Audit scope


[footium-eth-shareable @ 6c181ea79af7f6715e3891e65ea5ee8def1e957c](https://github.com/logiclogue/footium-eth-shareable/tree/6c181ea79af7f6715e3891e65ea5ee8def1e957c)
- [footium-eth-shareable/contracts/FootiumAcademy.sol](footium-eth-shareable/contracts/FootiumAcademy.sol)
- [footium-eth-shareable/contracts/FootiumClub.sol](footium-eth-shareable/contracts/FootiumClub.sol)
- [footium-eth-shareable/contracts/FootiumClubMinter.sol](footium-eth-shareable/contracts/FootiumClubMinter.sol)
- [footium-eth-shareable/contracts/FootiumEscrow.sol](footium-eth-shareable/contracts/FootiumEscrow.sol)
- [footium-eth-shareable/contracts/FootiumGeneralPaymentContract.sol](footium-eth-shareable/contracts/FootiumGeneralPaymentContract.sol)
- [footium-eth-shareable/contracts/FootiumPlayer.sol](footium-eth-shareable/contracts/FootiumPlayer.sol)
- [footium-eth-shareable/contracts/FootiumPrizeDistributor.sol](footium-eth-shareable/contracts/FootiumPrizeDistributor.sol)
- [footium-eth-shareable/contracts/FootiumToken.sol](footium-eth-shareable/contracts/FootiumToken.sol)
- [footium-eth-shareable/contracts/common/Errors.sol](footium-eth-shareable/contracts/common/Errors.sol)
- [footium-eth-shareable/contracts/interfaces/IFootiumClub.sol](footium-eth-shareable/contracts/interfaces/IFootiumClub.sol)
- [footium-eth-shareable/contracts/interfaces/IFootiumPlayer.sol](footium-eth-shareable/contracts/interfaces/IFootiumPlayer.sol)
- [footium-eth-shareable/contracts/mocks/FootiumPlayerMockV2.sol](footium-eth-shareable/contracts/mocks/FootiumPlayerMockV2.sol)


