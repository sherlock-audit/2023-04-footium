import "@nomiclabs/hardhat-ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployProxy, ZERO_ADDRESS, MINTER_ROLE } from "../scripts/helpers";

describe("Club Minter Contract", function () {
    let clubs, players, clubMinter, owner, receiver;

    before(async () => {
        [owner, receiver] = await ethers.getSigners();

        const receiverPercentage = 500; // hardcoded as we don't check/use it
        const tokenURI = "SomeTokenURI"; // hardcoded as we don't check/use it

        players = await deployProxy("FootiumPlayer", [
            receiver.address,
            receiverPercentage,
            tokenURI,
        ]);

        clubs = await deployProxy("FootiumClub", [""]);
        clubMinter = await deployProxy("FootiumClubMinter", [
            players.address,
            clubs.address,
        ]);

        await players.grantRole(MINTER_ROLE, clubMinter.address);
        await clubs.grantRole(MINTER_ROLE, clubMinter.address);
    });

    it("storage variables are properly initialized", async () => {
        expect(await clubMinter.footiumPlayer()).to.be.equal(players.address);
        expect(await clubMinter.footiumClub()).to.be.equal(clubs.address);
    });

    it("fails to set Player Contract address if not owner", async () => {
        await expect(
            clubMinter.connect(receiver).setPlayerAddress(receiver.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("successfully updates Player Contract address", async () => {
        await clubMinter.setPlayerAddress(receiver.address);

        expect(await clubMinter.footiumPlayer()).to.be.equal(receiver.address);

        // revert the original one
        await clubMinter.setPlayerAddress(players.address);
    });

    it("fails to set Club Contract address if not owner", async () => {
        await expect(
            clubMinter.connect(receiver).setClubAddress(receiver.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("successfully updates Club Contract address", async () => {
        await clubMinter.setClubAddress(receiver.address);

        expect(await clubMinter.footiumClub()).to.be.equal(receiver.address);

        // revert the original one
        await clubMinter.setClubAddress(clubs.address);
    });

    it("fails to mint a club if not owner", async () => {
        await expect(
            clubMinter.connect(receiver).mint(owner.address, 1)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("emits an ERC721 Transfer event from FootiumClub when minting a club", async () => {
        await expect(clubMinter.mint(owner.address, 1))
            .to.emit(clubs, "Transfer")
            .withArgs(ZERO_ADDRESS, owner.address, 1);
    });

    it("emits an ERC721 Transfer event from FootiumPlayer when minting a club", async () => {
        await expect(clubMinter.mint(owner.address, 2)).to.emit(
            players,
            "Transfer"
        );
    });
});
