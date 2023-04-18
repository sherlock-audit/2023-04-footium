import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import { ethers } from "hardhat";
import * as hre from "hardhat";
import { expect } from "chai";
import {
    deployProxy,
    getDivisionMintingFees,
    ZERO_ADDRESS,
    MINTER_ROLE,
    constructDivsMerkleTree,
    hashClubDivisionInputs,
    constructETHPrizeMerkleTree,
    hashETHPrizeInputs,
} from "../scripts/helpers";

const clubDivMetadata = require("../scripts/clubDivsMetadata.json");
const divFeeMetadata = require("../scripts/divFeesMetadata.json");

const clubDivsTree = constructDivsMerkleTree(clubDivMetadata);

describe("End To End testing", function () {
    let playerContract,
        clubContract,
        clubMinterContract,
        prizeDistributorContract,
        academyContract,
        contractOwner,
        clubOwner1,
        clubOwner2,
        minter,
        feeReceiver,
        receiverPercentage,
        tokenBaseURI;

    before(async () => {
        [contractOwner, minter, clubOwner1, clubOwner2, feeReceiver] =
            await ethers.getSigners();

        receiverPercentage = 500; // hardcoded as we don't check/use it
        tokenBaseURI = "SomeTokenURI/"; // hardcoded as we don't check/use it

        // deploy FootiumPlayer contract
        playerContract = await deployProxy("FootiumPlayer", [
            feeReceiver.address,
            receiverPercentage,
            tokenBaseURI,
        ]);

        // deploy FootiumClub contract
        clubContract = await deployProxy("FootiumClub", [tokenBaseURI]);

        // deploy FootiumClubMinter contract
        clubMinterContract = await deployProxy("FootiumClubMinter", [
            playerContract.address,
            clubContract.address,
        ]);

        // deploy FootiumPrizeDistributor contract
        prizeDistributorContract = await deployProxy("FootiumPrizeDistributor");

        // deploy FootiumAcademy contract
        const divisionFees = getDivisionMintingFees(divFeeMetadata);
        academyContract = await deployProxy("FootiumAcademy", [
            playerContract.address,
            clubContract.address,
            prizeDistributorContract.address,
            10,
            divisionFees,
        ]);

        // construct divisions merkle tree
        await academyContract.setClubDivsMerkleRoot(clubDivsTree.getHexRoot());

        // grant minter roles
        await playerContract.grantRole(MINTER_ROLE, clubMinterContract.address);
        await playerContract.grantRole(MINTER_ROLE, academyContract.address);
        await clubContract.grantRole(MINTER_ROLE, clubMinterContract.address);
    });

    it("should successfully mint a Footium club and starting squad of players", async () => {
        // mint a Footium club for clubOwner address
        const clubId1 = 1;
        const clubId2 = 2;

        // mint club with ID = 1 to clubOwner1 address
        await expect(clubMinterContract.mint(clubOwner1.address, clubId1))
            .to.emit(clubContract, "Transfer")
            .withArgs(ZERO_ADDRESS, clubOwner1.address, clubId1)
            .to.emit(playerContract, "Transfer");

        // make sure clubOwner1 owns the club with ID = 1
        expect(await clubContract.ownerOf(clubId1)).to.be.equal(
            clubOwner1.address
        );

        // make sure club 1 escrow contract owns 20 players of the club
        let escrowAddress = await clubContract.clubToEscrow(clubId1);

        let mintedPlayerCount = await playerContract.balanceOf(escrowAddress);
        expect(mintedPlayerCount.toString()).to.be.equal("20");

        // mint club with ID = 2 to clubOwner2 address
        await expect(clubMinterContract.mint(clubOwner2.address, clubId2))
            .to.emit(clubContract, "Transfer")
            .withArgs(ZERO_ADDRESS, clubOwner2.address, clubId2)
            .to.emit(playerContract, "Transfer");

        // make sure clubOwner2 owns the club with ID = 2
        expect(await clubContract.ownerOf(clubId2)).to.be.equal(
            clubOwner2.address
        );

        // make sure club 2 escrow contract owns 20 players of the club
        escrowAddress = await clubContract.clubToEscrow(clubId2);

        mintedPlayerCount = await playerContract.balanceOf(escrowAddress);
        expect(mintedPlayerCount.toString()).to.be.equal("20");
    });

    it("should successfully mint academy players", async () => {
        let seasonId = 1;
        const clubId1 = 1;
        const clubId2 = 2;
        const divisionTier1 = 1;
        const divisionTier2 = 2;

        // fails to mint if the club is not in division: [clubId = 1, division = 2]
        let clubDivProof = clubDivsTree.getHexProof(
            hashClubDivisionInputs([1, 1])
        );
        await expect(
            academyContract.mintPlayers(
                seasonId,
                clubId1,
                divisionTier2,
                [0],
                clubDivProof,
                {
                    value: ethers.utils.parseEther("1"),
                }
            )
        )
            .to.be.revertedWithCustomError(academyContract, "ClubNotInDivision")
            .withArgs(clubId1, divisionTier2);

        // fails to mint players if the minter is not the club owner
        clubDivProof = clubDivsTree.getHexProof(hashClubDivisionInputs([1, 1]));
        await expect(
            academyContract.mintPlayers(
                seasonId,
                clubId1,
                divisionTier1,
                [0],
                clubDivProof,
                {
                    value: ethers.utils.parseEther("1"),
                }
            )
        )
            .to.be.revertedWithCustomError(academyContract, "NotClubOwner")
            .withArgs(clubId1, contractOwner.address);

        // fails to mint a player with incorrect fee
        // test for divisionTier1;
        clubDivProof = clubDivsTree.getHexProof(hashClubDivisionInputs([1, 1]));
        await expect(
            academyContract
                .connect(clubOwner1)
                .mintPlayers(
                    seasonId,
                    clubId1,
                    divisionTier1,
                    [0],
                    clubDivProof,
                    {
                        value: ethers.utils.parseEther("0.16"), // expected 0.17, sent 0.16
                    }
                )
        )
            .to.be.revertedWithCustomError(
                academyContract,
                "IncorrectETHAmount"
            )
            .withArgs("160000000000000000");

        // fails to mint a player with incorrect fee
        // test for divisionTier2;
        clubDivProof = clubDivsTree.getHexProof(hashClubDivisionInputs([2, 2]));
        await expect(
            academyContract
                .connect(clubOwner2)
                .mintPlayers(
                    seasonId,
                    clubId2,
                    divisionTier2,
                    [0],
                    clubDivProof,
                    {
                        value: ethers.utils.parseEther("0.11"),
                    }
                )
        )
            .to.be.revertedWithCustomError(
                academyContract,
                "IncorrectETHAmount"
            )
            .withArgs("110000000000000000");

        // fails to mint multiple players with the same generationId
        clubDivProof = clubDivsTree.getHexProof(hashClubDivisionInputs([2, 2]));
        await expect(
            academyContract
                .connect(clubOwner2)
                .mintPlayers(
                    seasonId,
                    clubId2,
                    divisionTier2,
                    [0, 0],
                    clubDivProof,
                    {
                        value: ethers.utils.parseEther("0.24"),
                    }
                )
        )
            .to.be.revertedWithCustomError(
                academyContract,
                "PlayerAlreadyRedeemed"
            )
            .withArgs(0);

        // fails to mint multiple players more than maxGenerationId
        clubDivProof = clubDivsTree.getHexProof(hashClubDivisionInputs([1, 1]));
        await expect(
            academyContract
                .connect(clubOwner1)
                .mintPlayers(
                    seasonId,
                    clubId1,
                    divisionTier1,
                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    clubDivProof,
                    {
                        value: ethers.utils.parseEther("2"),
                    }
                )
        )
            .to.be.revertedWithCustomError(
                academyContract,
                "GenerationIDTooHigh"
            )
            .withArgs(11, 10);

        // change current season
        seasonId = 5;
        await academyContract.changeCurrentSeasonId(seasonId);

        let incorrectSeasonId = 1;

        // try minting players from season 1 - should fail
        clubDivProof = clubDivsTree.getHexProof(hashClubDivisionInputs([1, 1]));
        await expect(
            academyContract
                .connect(clubOwner1)
                .mintPlayers(
                    incorrectSeasonId,
                    clubId1,
                    divisionTier1,
                    [1],
                    clubDivProof,
                    {
                        value: ethers.utils.parseEther("0.2"),
                    }
                )
        )
            .to.be.revertedWithCustomError(academyContract, "PlayerTooOld")
            .withArgs(seasonId);

        // try minting players from season 6 - should fail
        incorrectSeasonId = 6;
        clubDivProof = clubDivsTree.getHexProof(hashClubDivisionInputs([1, 1]));
        await expect(
            academyContract
                .connect(clubOwner1)
                .mintPlayers(
                    incorrectSeasonId,
                    clubId1,
                    divisionTier1,
                    [1],
                    clubDivProof,
                    {
                        value: ethers.utils.parseEther("0.2"),
                    }
                )
        )
            .to.be.revertedWithCustomError(academyContract, "PlayerTooYoung")
            .withArgs(incorrectSeasonId);

        // // revert to the original seasonId
        // await academyContract.changeCurrentSeasonId(newSeason);

        // mint players for club1/divisionTier1
        await academyContract
            .connect(clubOwner1)
            .mintPlayers(
                seasonId,
                clubId1,
                divisionTier1,
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                clubDivProof,
                {
                    value: ethers.utils.parseEther("1.7"), // 10 * 0.17 = 1.7
                }
            );

        const club1EscrowAddress = await clubContract.clubToEscrow(clubId1);

        let mintedPlayerCount = await playerContract.balanceOf(
            club1EscrowAddress
        );
        expect(mintedPlayerCount.toString()).to.be.equal("30"); // 20 initial squad + 10 academy players

        // mint players for club2/divisionTier2
        clubDivProof = clubDivsTree.getHexProof(hashClubDivisionInputs([2, 2]));
        await academyContract
            .connect(clubOwner2)
            .mintPlayers(
                seasonId,
                clubId2,
                divisionTier2,
                [1, 2, 3, 4, 5],
                clubDivProof,
                {
                    value: ethers.utils.parseEther("0.6"), // 5 * 0.12 = 0.6
                }
            );

        const club2EscrowAddress = await clubContract.clubToEscrow(clubId2);

        mintedPlayerCount = await playerContract.balanceOf(club2EscrowAddress);
        expect(mintedPlayerCount.toString()).to.be.equal("25"); // 20 initial squad + 5 academy players

        divFeeMetadata[1].mintingFee = 0.15; // divisionTier2 fee updated from 0.12 to 0.15
        await academyContract.setDivisionFees(
            getDivisionMintingFees(divFeeMetadata)
        );

        await academyContract
            .connect(clubOwner2)
            .mintPlayers(
                seasonId,
                clubId2,
                divisionTier2,
                [6, 7, 8, 9, 10],
                clubDivProof,
                {
                    value: ethers.utils.parseEther("0.75"), // 5 * 0.15 = 0.75
                }
            );

        mintedPlayerCount = await playerContract.balanceOf(club2EscrowAddress);
        expect(mintedPlayerCount.toString()).to.be.equal("30"); // 20 initial squad + 5 initial minted academy players + 5 new minted academy players
    });

    it("should successfully claimed the ETH prize by receiver address", async () => {
        // create a merkle root with the prizes calculated above
        const totalAmount = ethers.utils
            .parseEther("1.7")
            .add(ethers.utils.parseEther("0.6"))
            .add(ethers.utils.parseEther("0.75"));

        const clubId1 = 1;
        const escrowAddress = await clubContract.clubToEscrow(clubId1);

        const EscrowContract = await ethers.getContractFactory("FootiumEscrow");
        const escrowContractInstance = await EscrowContract.attach(
            escrowAddress
        );

        const ethMerkleTree = constructETHPrizeMerkleTree([
            [escrowAddress, totalAmount],
        ]);
        await prizeDistributorContract.setETHMerkleRoot(
            ethMerkleTree.getHexRoot()
        );

        // trying to claim the available prize by incorrect user - should fail
        const leaf = hashETHPrizeInputs([escrowAddress, totalAmount]);
        const proof = ethMerkleTree.getHexProof(leaf);

        await expect(
            prizeDistributorContract.claimETHPrize(
                clubOwner1.address,
                totalAmount,
                proof
            )
        ).to.be.revertedWithCustomError(
            prizeDistributorContract,
            "InvalidAccount"
        );

        // trying to claim prize with incorrect amount - should fail
        const extraAmount = ethers.utils.parseEther("0.1");
        await expect(
            prizeDistributorContract
                .connect(feeReceiver)
                .claimETHPrize(
                    feeReceiver.address,
                    totalAmount.add(extraAmount),
                    proof
                )
        ).to.be.revertedWithCustomError(
            prizeDistributorContract,
            "InvalidETHMerkleProof"
        );

        // Add escrow address to the signer address list
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [escrowAddress],
        });

        // claim the available prize by the designated user
        const escrowSigner = await ethers.getSigner(escrowAddress);

        const ethAmount = ethers.utils.parseEther("1.0");

        await contractOwner.sendTransaction({
            to: escrowAddress,
            value: ethAmount, // Sends exactly 1.0 ether
        });

        const escrowBalanceBefore = await ethers.provider.getBalance(
            escrowAddress
        );

        let tx = await prizeDistributorContract
            .connect(escrowSigner)
            .claimETHPrize(escrowAddress, totalAmount, proof);

        const escrowBalanceAfter = await ethers.provider.getBalance(
            escrowAddress
        );

        let receipt = await tx.wait();

        expect(receipt.events[1].event).to.equal("ClaimETH");
        expect(receipt.events[1].args[0]).to.equal(escrowAddress);
        expect(receipt.events[1].args[1].toString()).to.equal(
            totalAmount.toString()
        );

        let fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        expect(escrowBalanceAfter.sub(escrowBalanceBefore).toString()).to.equal(
            totalAmount.sub(fee).toString()
        );

        // if the user tries to claim again, they will get 0
        await expect(
            prizeDistributorContract
                .connect(escrowSigner)
                .claimETHPrize(escrowAddress, totalAmount, proof)
        )
            .to.emit(prizeDistributorContract, "ClaimETH")
            .withArgs(escrowAddress, 0);

        // withdraw club1 escrow contract balance - can be done only by club1 owner
        const club1OwnerBalanceBefore = await ethers.provider.getBalance(
            clubOwner1.address
        );

        const escrowFinalBalance = await ethers.provider.getBalance(
            escrowAddress
        );

        tx = await escrowContractInstance.connect(clubOwner1).withdraw();
        receipt = await tx.wait();
        fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        const club1OwnerBalanceAfter = await ethers.provider.getBalance(
            clubOwner1.address
        );

        expect(
            club1OwnerBalanceAfter.sub(club1OwnerBalanceBefore).toString()
        ).to.equal(escrowFinalBalance.sub(fee).toString());

        // Remove escrow address from the signer address list
        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [escrowAddress],
        });
    });
});
