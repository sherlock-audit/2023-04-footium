import "@nomiclabs/hardhat-ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
    constructDivsMerkleTree,
    getRandomBytes32,
    getDivisionMintingFees,
    deployProxy,
    hashClubDivisionInputs,
    MINTER_ROLE,
} from "../scripts/helpers";

const clubDivMetadata = require("../scripts/clubDivsMetadata.json");
const divFeeMetadata = require("../scripts/divFeesMetadata.json");

const clubDivsTree = constructDivsMerkleTree(clubDivMetadata);

describe("Footium Academy Contract", function () {
    let academy, players, distributor, escrowAddr, owner, addr1, divisionFees;

    before(async () => {
        [owner, addr1] = await ethers.getSigners();

        const receiverAddress = addr1.address;
        const receiverPercentage = 500; // hardcoded as we don't check/use it
        const tokenURI = "SomeTokenURI"; // hardcoded as we don't check/use it

        divisionFees = getDivisionMintingFees(divFeeMetadata);

        players = await deployProxy("FootiumPlayer", [
            receiverAddress,
            receiverPercentage,
            tokenURI,
        ]);

        distributor = await deployProxy("FootiumPrizeDistributor");

        const clubs = await deployProxy("FootiumClub", [""]);

        academy = await deployProxy("FootiumAcademy", [
            players.address,
            clubs.address,
            distributor.address,
            10,
            divisionFees,
        ]);
        await players.grantRole(MINTER_ROLE, academy.address);
        await clubs.grantRole(MINTER_ROLE, owner.address);

        await clubs.safeMint(addr1.address, 1);
        await clubs.safeMint(addr1.address, 7);

        await academy.setClubDivsMerkleRoot(clubDivsTree.getHexRoot());

        escrowAddr = await clubs.clubToEscrow(1);
    });
    context("Initializer", () => {
        it("storage variables are properly initialized", async () => {
            const currentSeasonId = await academy.currentSeasonId();
            expect(currentSeasonId.toNumber()).to.equal(1);

            const academyMinAge = await academy.academyMinAge();
            expect(academyMinAge.toNumber()).to.equal(18);

            const academyMaxAge = await academy.academyMaxAge();
            expect(academyMaxAge.toNumber()).to.equal(20);
        });
    });

    context("changing max generation Id", () => {
        it("fails if caller is not the contract owner", async () => {
            const maxGenerationId = 10;
            await expect(
                academy.connect(addr1).changeMaxGenerationId(maxGenerationId)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("updates max generation ID", async () => {
            const maxGenerationId = 10;
            await expect(academy.changeMaxGenerationId(maxGenerationId))
                .to.emit(academy, "ChangedMaxGenerationId")
                .withArgs(maxGenerationId);
        });
    });

    context("changing club divs MerkleRoot", () => {
        it("fails if caller is not the contract owner", async () => {
            const newRoot = getRandomBytes32();
            await expect(
                academy.connect(addr1).setClubDivsMerkleRoot(newRoot)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("updates club divs MerkleRoot", async () => {
            const newRoot = getRandomBytes32();
            await expect(academy.setClubDivsMerkleRoot(newRoot))
                .to.emit(academy, "ChangedClubDivsMerkleRoot")
                .withArgs(newRoot);

            // restore the original one
            academy.setClubDivsMerkleRoot(clubDivsTree.getHexRoot());
        });
    });

    context("setting division fees", () => {
        it("fails if caller is not the contract owner", async () => {
            const fees = [1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
                ethers.utils.parseEther(i.toString())
            );
            await expect(
                academy.connect(addr1).setDivisionFees(fees)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("updates the division fees", async () => {
            const fees = [1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
                ethers.utils.parseEther(i.toString())
            );
            await expect(academy.setDivisionFees(fees))
                .to.emit(academy, "ChangedDivisionFees")
                .withArgs(fees);
        });
        it("has correctly updated the fees", async () => {
            for (let i = 1; i <= 8; ++i) {
                const fee = await academy.divisionToFee(i);
                expect(fee.toString()).to.equal(
                    ethers.utils.parseEther(i.toString())
                );
            }

            // Revert to the original division fees
            await academy.setDivisionFees(divisionFees);
        });
    });

    context("Pausable", () => {
        it("should fail to pause the contract if caller is not the contract owner", async () => {
            await expect(
                academy.connect(addr1).pauseContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully pause the contract", async () => {
            await expect(academy.pauseContract())
                .to.emit(academy, "Paused")
                .withArgs(owner.address);
        });
        it("should fail to activate the contract if caller is not the contract owner", async () => {
            await expect(
                academy.connect(addr1).activateContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully activate the contract", async () => {
            await expect(academy.activateContract())
                .to.emit(academy, "Unpaused")
                .withArgs(owner.address);
        });
    });

    context("minting players in a valid cohort", () => {
        //const token = [clubId = 7, division = 4]
        const clubDivProof = clubDivsTree.getHexProof(
            hashClubDivisionInputs([7, 4])
        );

        it("correctly changed the maximum generation ID works", async () => {
            await expect(academy.changeMaxGenerationId(5)).to.not.be.reverted;
        });

        it("can't mint if incorrect division inputted", async () => {
            await expect(
                academy.mintPlayers(1, 7, 5, [0], clubDivProof, {
                    value: ethers.utils.parseEther("10"),
                })
            )
                .to.be.revertedWithCustomError(academy, "ClubNotInDivision")
                .withArgs(7, 5);
        });

        it("can't mint if not club owner", async () => {
            const divisionTier = 4;
            await expect(
                academy.mintPlayers(1, 7, divisionTier, [0], clubDivProof, {
                    value: divisionFees[divisionTier - 1],
                })
            )
                .to.be.revertedWithCustomError(academy, "NotClubOwner")
                .withArgs(7, owner.address);
        });

        it("can't mint if incorrect fees have been sent", async () => {
            await expect(
                academy.connect(addr1).mintPlayers(1, 7, 4, [0], clubDivProof, {
                    value: divisionFees[7], // div 7 fee < div 4 fee
                })
            )
                .to.be.revertedWithCustomError(academy, "IncorrectETHAmount")
                .withArgs(divisionFees[7]);
        });

        it("can't mint too many players", async () => {
            const divisionTier = 4;
            const generationIds = [1, 2, 3, 4, 5, 11];
            await academy.changeMaxGenerationId(10);

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayers(
                        1,
                        7,
                        divisionTier,
                        generationIds,
                        clubDivProof,
                        {
                            value: ethers.BigNumber.from(
                                divisionFees[divisionTier - 1]
                            ).mul(generationIds.length),
                        }
                    )
            ).to.be.revertedWithCustomError(academy, "GenerationIDTooHigh");
        });

        it("can't mint if the contract is paused", async () => {
            const divisionTier = 4;
            const generationIds = [0, 1, 2, 3, 4, 5, 6];
            const ethAmount = ethers.BigNumber.from(divisionFees[0]).mul(
                generationIds.length
            );

            await academy.pauseContract();

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayers(
                        1,
                        7,
                        divisionTier,
                        generationIds,
                        clubDivProof,
                        {
                            value: ethAmount,
                        }
                    )
            ).to.be.revertedWith("Pausable: paused");

            await academy.activateContract();
        });

        it("can mint players", async () => {
            const divisionTier = 4;
            const generationIds = [0, 1, 2, 3, 4, 5, 6];
            const ethAmount = ethers.BigNumber.from(divisionFees[0]).mul(
                generationIds.length
            );

            const distributorBalanceBefore = await ethers.provider.getBalance(
                distributor.address
            );

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayers(
                        1,
                        7,
                        divisionTier,
                        generationIds,
                        clubDivProof,
                        {
                            value: ethAmount,
                        }
                    )
            ).to.not.reverted;

            const distributorBalanceAfter = await ethers.provider.getBalance(
                distributor.address
            );
            const divisionFee = await academy.divisionToFee(divisionTier);
            const expectedBalance =
                generationIds.length * parseInt(divisionFee.toString());

            expect(
                distributorBalanceAfter.sub(distributorBalanceBefore).toString()
            ).to.equal(expectedBalance.toString());
        });
    });

    context("minting players with seasonId 0", () => {
        const clubDivProof = clubDivsTree.getHexProof(
            hashClubDivisionInputs([7, 4])
        );

        it("fails to mint the players", async () => {
            const generationIds = [0, 1, 2, 3, 4, 5, 6];
            const divisionTier = 4;
            const ethAmount = ethers.BigNumber.from(
                divisionFees[divisionTier - 1]
            ).mul(generationIds.length);

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayers(
                        0,
                        7,
                        divisionTier,
                        generationIds,
                        clubDivProof,
                        {
                            value: ethAmount,
                        }
                    )
            )
                .to.be.revertedWithCustomError(academy, "InvalidSeasonId")
                .withArgs(0);
        });
    });

    context("minting players in season 2", () => {
        const clubDivProof = clubDivsTree.getHexProof(
            hashClubDivisionInputs([7, 4])
        );

        context("the current season is season 1", () => {
            it("fails to mint the players", async () => {
                const divisionTier = 4;
                const generationIds = [0, 1, 2, 3, 4, 5, 6];
                const ethAmount = ethers.BigNumber.from(
                    divisionFees[divisionTier - 1]
                ).mul(generationIds.length);

                await expect(
                    academy
                        .connect(addr1)
                        .mintPlayers(
                            2,
                            7,
                            divisionTier,
                            [0, 1, 2, 3, 4, 5, 6],
                            clubDivProof,
                            {
                                value: ethAmount,
                            }
                        )
                )
                    .to.be.revertedWithCustomError(academy, "PlayerTooYoung")
                    .withArgs(2);
            });
        });

        context("the season is updated to season 2", () => {
            it("has updated the season", async () => {
                await expect(academy.changeCurrentSeasonId(2))
                    .to.emit(academy, "ChangedCurrentSeasonId")
                    .withArgs(2);
            });

            it("succeeds to mint the players", async () => {
                const divisionTier = 4;
                const generationIds = [0, 1, 2, 3, 4, 5, 6];
                const ethAmount = ethers.BigNumber.from(
                    divisionFees[divisionTier - 1]
                ).mul(generationIds.length);

                const distributorBalanceBefore =
                    await ethers.provider.getBalance(distributor.address);

                await expect(
                    academy
                        .connect(addr1)
                        .mintPlayers(
                            2,
                            7,
                            divisionTier,
                            generationIds,
                            clubDivProof,
                            {
                                value: ethAmount,
                            }
                        )
                ).to.not.be.reverted;

                const distributorBalanceAfter =
                    await ethers.provider.getBalance(distributor.address);
                const divisionFee = await academy.divisionToFee(divisionTier);
                const expectedBalance =
                    generationIds.length * parseInt(divisionFee.toString());

                expect(
                    distributorBalanceAfter
                        .sub(distributorBalanceBefore)
                        .toString()
                ).to.equal(expectedBalance.toString());
            });
        });
    });

    context("try to mint a 23 year old player", () => {
        //const token = [7,4]
        const clubDivProof = clubDivsTree.getHexProof(
            hashClubDivisionInputs([7, 4])
        );

        //players that were 18 in the first cohort are now 23
        it("has updated the season", async () => {
            await expect(academy.changeCurrentSeasonId(5))
                .to.emit(academy, "ChangedCurrentSeasonId")
                .withArgs(5);
        });

        it("fails to mint the players", async () => {
            const divisionTier = 4;
            const generationIds = [0, 1, 2, 3, 4, 5, 6];
            const ethAmount = ethers.BigNumber.from(
                divisionFees[divisionTier - 1]
            ).mul(generationIds.length);

            await expect(
                academy
                    .connect(addr1)
                    .mintPlayers(
                        2,
                        7,
                        divisionTier,
                        [0, 1, 2, 3, 4, 5, 6],
                        clubDivProof,
                        {
                            value: ethAmount,
                        }
                    )
            ).to.be.revertedWithCustomError(academy, "PlayerTooOld");
        });
    });

    context("withdraw available ETH from the contract", () => {
        it("fails to withdraw if caller is not the contract owner", async () => {
            await expect(academy.connect(addr1).withdraw()).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("successfully withdraws available ETH from the contract", async () => {
            const contractBalanceBefore = await ethers.provider.getBalance(
                academy.address
            );
            const ownerBalanceBefore = await ethers.provider.getBalance(
                owner.address
            );

            const tx = await academy.withdraw();
            const receipt = await tx.wait();
            const fee = receipt.gasUsed.mul(receipt.effectiveGasPrice);

            const contractBalanceAfter = await ethers.provider.getBalance(
                academy.address
            );
            const ownerBalanceAfter = await ethers.provider.getBalance(
                owner.address
            );

            expect(contractBalanceAfter.toString()).to.equal("0");
            expect(
                ownerBalanceAfter.sub(ownerBalanceBefore).toString()
            ).to.equal(contractBalanceBefore.sub(fee).toString());
        });
    });
});
