import "@nomiclabs/hardhat-ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { hashMessage } from "@ethersproject/hash";
import { deployProxy, MINTER_ROLE } from "../scripts/helpers";

const CLUB_ID = 1;
const MESSAGE = "Let's verify the signature of this message!";

describe("Escrow Contract", function () {
    let escrow, token, players, owner, addr1;

    before(async () => {
        [owner, addr1] = await ethers.getSigners();

        const clubs = await deployProxy("FootiumClub", [""]);
        token = await deployProxy("FootiumToken");

        const receiverAddress = addr1.address;
        const receiverPercentage = 500; // hardcoded as we don't check/use it
        const tokenURI = "SomeTokenURI"; // hardcoded as we don't check/use it

        players = await deployProxy("FootiumPlayer", [
            receiverAddress,
            receiverPercentage,
            tokenURI,
        ]);

        await players.grantRole(MINTER_ROLE, owner.address);
        await clubs.grantRole(MINTER_ROLE, owner.address);

        await clubs.safeMint(owner.address, CLUB_ID);

        const escrowAddress = await clubs.clubToEscrow(CLUB_ID);
        const EscrowFactory = await ethers.getContractFactory("FootiumEscrow");
        escrow = EscrowFactory.attach(escrowAddress);
    });

    it("isValidSignature() returns the magic value for the club owner", async () => {
        const signature = await owner.signMessage(MESSAGE);
        const hash = hashMessage(MESSAGE);

        expect(await escrow.isValidSignature(hash, signature)).to.be.equal(
            "0x1626ba7e"
        );
    });

    it("isValidSignature() doesn't return the magic value for non-owners", async () => {
        const message = "Let's verify the signature of this message!";
        const signature = await addr1.signMessage(message);
        const hash = hashMessage(message);

        expect(await escrow.isValidSignature(hash, signature)).to.be.equal(
            "0xffffffff"
        );
    });

    it("emits an ERC20 Transfer event when calling TransferERC20()", async () => {
        const amount = 1000000;

        await token.mint(escrow.address, "10000000000000");

        await expect(
            escrow
                .connect(owner)
                .transferERC20(token.address, addr1.address, amount)
        )
            .to.emit(token, "Transfer")
            .withArgs(escrow.address, addr1.address, amount);
    });

    it("emits an ERC20 Approval event when calling setApprovalForERC20()", async () => {
        const amount = 1000000;

        await expect(
            escrow
                .connect(owner)
                .setApprovalForERC20(token.address, addr1.address, amount)
        )
            .to.emit(token, "Approval")
            .withArgs(escrow.address, addr1.address, amount);
    });

    it("emits an ERC721 Transfer event when calling TransferERC721()", async () => {
        const tokenId = 0;

        await players.safeMint(escrow.address);

        await expect(
            escrow.transferERC721(players.address, addr1.address, tokenId)
        )
            .to.emit(players, "Transfer")
            .withArgs(escrow.address, addr1.address, tokenId);
    });

    it("emits an ERC721 Approval event when calling setApprovalForERC721()", async () => {
        await expect(
            escrow
                .connect(owner)
                .setApprovalForERC721(players.address, addr1.address, true)
        )
            .to.emit(players, "ApprovalForAll")
            .withArgs(escrow.address, addr1.address, true);

        await expect(
            escrow
                .connect(owner)
                .setApprovalForERC721(players.address, addr1.address, false)
        )
            .to.emit(players, "ApprovalForAll")
            .withArgs(escrow.address, addr1.address, false);
    });

    it("should be able to receive ETH amount", async () => {
        const addressBalanceBefore = await ethers.provider.getBalance(
            owner.address
        );

        // send 1 eth to the FootiumEscrow contract
        const ethAmount = ethers.utils.parseEther("1.0");
        const tx = await owner.sendTransaction({
            to: escrow.address,
            value: ethAmount, // Sends exactly 1.0 ether
        });

        const receipt = await tx.wait();
        const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        const addressBalanceAfter = await ethers.provider.getBalance(
            owner.address
        );

        expect(
            addressBalanceBefore.sub(addressBalanceAfter).toString()
        ).to.equal(ethAmount.add(fee).toString());
    });

    it("should fail if non club owner tries to withdraw ETH", async () => {
        await expect(
            escrow.connect(addr1).withdraw()
        ).to.be.revertedWithCustomError(escrow, "NotClubOwner");
    });

    it("should successfully withdraw ETH by club owner", async () => {
        const ownerBalanceBefore = await ethers.provider.getBalance(
            owner.address
        );

        const ethAmount = ethers.utils.parseEther("1.0");

        const tx = await escrow.connect(owner).withdraw();
        const receipt = await tx.wait();
        const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        const ownerBalanceAfter = await ethers.provider.getBalance(
            owner.address
        );

        expect(ownerBalanceAfter.sub(ownerBalanceBefore).toString()).to.equal(
            ethAmount.sub(fee).toString()
        );
    });
});
