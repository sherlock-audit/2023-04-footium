import "@nomiclabs/hardhat-ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
    constructERC20PrizeMerkleTree,
    constructETHPrizeMerkleTree,
    deployProxy,
    getRandomBytes32,
    hashERC20PrizeInputs,
    hashETHPrizeInputs,
} from "../scripts/helpers";

const INITIAL_AMOUNT = 150;
const EXTRA = 40;

describe("Prize Distributor Contract", function () {
    let distributor, owner, token, addr1, addr2, erc20MerkleTree, ethMerkleTree;

    before(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();

        distributor = await deployProxy("FootiumPrizeDistributor");
        token = await deployProxy("FootiumToken");

        erc20MerkleTree = constructERC20PrizeMerkleTree([
            [token.address, addr1.address, INITIAL_AMOUNT],
        ]);
        ethMerkleTree = constructETHPrizeMerkleTree([
            [addr2.address, INITIAL_AMOUNT],
        ]);
        console.log("ERC20 PRIZES", erc20MerkleTree);
        console.log("ETH PRIZES", ethMerkleTree);

        await distributor.setERC20MerkleRoot(erc20MerkleTree.getHexRoot());
        await distributor.setETHMerkleRoot(ethMerkleTree.getHexRoot());
    });

    context("Set ERC20 MerkleRoot", () => {
        it("receives ETH and emits an ETHReceived event", async () => {
            const amount = "1000";
            await expect(
                owner.sendTransaction({
                    to: distributor.address,
                    value: ethers.utils.parseEther(amount),
                })
            )
                .to.emit(distributor, "ETHReceived")
                .withArgs(owner.address, ethers.utils.parseEther(amount));
        });
    });

    context("Set ERC20 MerkleRoot", () => {
        it("should fail if caller is not the contract owner", async () => {
            const newRoot = getRandomBytes32();

            await expect(
                distributor.connect(addr1).setERC20MerkleRoot(newRoot)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully update ERC20 merkle root", async () => {
            const newRoot = getRandomBytes32();

            await expect(distributor.setERC20MerkleRoot(newRoot))
                .to.emit(distributor, "SetERC20MerkleRoot")
                .withArgs(newRoot);

            await distributor.setERC20MerkleRoot(erc20MerkleTree.getHexRoot());
        });
    });

    context("Set ETH MerkleRoot", () => {
        it("should fail if caller is not the contract owner", async () => {
            const newRoot = getRandomBytes32();

            await expect(
                distributor.connect(addr1).setETHMerkleRoot(newRoot)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully update ETH merkle root", async () => {
            const newRoot = getRandomBytes32();

            await expect(distributor.setETHMerkleRoot(newRoot))
                .to.emit(distributor, "SetETHMerkleRoot")
                .withArgs(newRoot);

            await distributor.setETHMerkleRoot(ethMerkleTree.getHexRoot());
        });
    });

    context("receiving ERC20 tokens to the Prize Distributor", () => {
        it("doesn't revert", async () => {
            await expect(token.mint(distributor.address, "100000")).to.not.be
                .reverted;
        });
    });

    context("Pausable", () => {
        it("should fail to pause the contract if caller is not the contract owner", async () => {
            await expect(
                distributor.connect(addr1).pauseContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully pause the contract", async () => {
            await expect(distributor.pauseContract())
                .to.emit(distributor, "Paused")
                .withArgs(owner.address);
        });
        it("should fail to activate the contract if caller is not the contract owner", async () => {
            await expect(
                distributor.connect(addr1).activateContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully activate the contract", async () => {
            await expect(distributor.activateContract())
                .to.emit(distributor, "Unpaused")
                .withArgs(owner.address);
        });
    });

    context("claiming ERC20 tokens", () => {
        it("reverts if claiming ERC20 tokens by invalid account address", async () => {
            token.mint(distributor.address, "300");

            const leaf = hashERC20PrizeInputs([
                token.address,
                addr1.address,
                INITIAL_AMOUNT,
            ]);
            const proof = erc20MerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr2)
                    .claimERC20Prize(
                        addr1.address,
                        token.address,
                        INITIAL_AMOUNT,
                        proof
                    )
            ).to.be.revertedWithCustomError(distributor, "InvalidAccount");
        });

        it("reverts if claiming ERC20 tokens with an invalid amount", async () => {
            token.mint(distributor.address, "INITIAL_AMOUNT");

            const leaf = hashERC20PrizeInputs([
                token.address,
                addr1.address,
                INITIAL_AMOUNT,
            ]);
            const proof = erc20MerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr1)
                    .claimERC20Prize(addr1.address, token.address, 100, proof)
            ).to.be.revertedWithCustomError(
                distributor,
                "InvalidERC20MerkleProof"
            );
        });

        it("should fail if contract is paused", async () => {
            const leaf = hashERC20PrizeInputs([
                token.address,
                addr1.address,
                INITIAL_AMOUNT,
            ]);
            const proof = erc20MerkleTree.getHexProof(leaf);

            await distributor.pauseContract();

            await expect(
                distributor
                    .connect(addr1)
                    .claimERC20Prize(
                        addr1.address,
                        token.address,
                        INITIAL_AMOUNT,
                        proof
                    )
            ).to.be.revertedWith("Pausable: paused");

            await distributor.activateContract();
        });

        it("emits a ClaimERC20 event if claiming tokens with a valid proof", async () => {
            const leaf = hashERC20PrizeInputs([
                token.address,
                addr1.address,
                INITIAL_AMOUNT,
            ]);
            const proof = erc20MerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr1)
                    .claimERC20Prize(
                        addr1.address,
                        token.address,
                        INITIAL_AMOUNT,
                        proof
                    )
            )
                .to.emit(distributor, "ClaimERC20")
                .withArgs(token.address, addr1.address, INITIAL_AMOUNT);
        });

        it("emits a ClaimERC20 event of zero tokens when claiming for the second time", async () => {
            const leaf = hashERC20PrizeInputs([
                token.address,
                addr1.address,
                INITIAL_AMOUNT,
            ]);
            const proof = erc20MerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr1)
                    .claimERC20Prize(
                        addr1.address,
                        token.address,
                        INITIAL_AMOUNT,
                        proof
                    )
            )
                .to.emit(distributor, "ClaimERC20")
                .withArgs(token.address, addr1.address, 0);
        });

        it("emits a ClaimERC20 event when claiming after the merkle root is updated", async () => {
            erc20MerkleTree = constructERC20PrizeMerkleTree([
                [token.address, addr1.address, INITIAL_AMOUNT + EXTRA],
            ]);

            await distributor.setERC20MerkleRoot(erc20MerkleTree.getHexRoot());

            const leaf = hashERC20PrizeInputs([
                token.address,
                addr1.address,
                INITIAL_AMOUNT + EXTRA,
            ]);
            const proof = erc20MerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr1)
                    .claimERC20Prize(
                        addr1.address,
                        token.address,
                        INITIAL_AMOUNT + EXTRA,
                        proof
                    )
            )
                .to.emit(distributor, "ClaimERC20")
                .withArgs(token.address, addr1.address, EXTRA);
        });

        it("emits a ClaimERC20 event of zero tokens when claiming for a second time after the merkle root is updated", async () => {
            const leaf = hashERC20PrizeInputs([
                token.address,
                addr1.address,
                INITIAL_AMOUNT + EXTRA,
            ]);
            const proof = erc20MerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr1)
                    .claimERC20Prize(
                        addr1.address,
                        token.address,
                        INITIAL_AMOUNT + EXTRA,
                        proof
                    )
            )
                .to.emit(distributor, "ClaimERC20")
                .withArgs(token.address, addr1.address, 0);
        });
    });

    context("claiming ETH tokens", () => {
        it("reverts if claiming ERC20 tokens by invalid account address", async () => {
            const leaf = hashETHPrizeInputs([addr2.address, INITIAL_AMOUNT]);
            const proof = ethMerkleTree.getHexProof(leaf);

            await expect(
                distributor.claimETHPrize(addr2.address, INITIAL_AMOUNT, proof)
            ).to.be.revertedWithCustomError(distributor, "InvalidAccount");
        });

        it("reverts if claiming ETH tokens with an invalid amount", async () => {
            const leaf = hashETHPrizeInputs([addr2.address, INITIAL_AMOUNT]);
            const proof = ethMerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr2)
                    .claimETHPrize(addr2.address, 100, proof)
            ).to.be.revertedWithCustomError(
                distributor,
                "InvalidETHMerkleProof"
            );
        });

        it("should fail if contract is paused", async () => {
            const leaf = hashETHPrizeInputs([addr2.address, INITIAL_AMOUNT]);
            const proof = ethMerkleTree.getHexProof(leaf);

            await distributor.pauseContract();

            await expect(
                distributor
                    .connect(addr2)
                    .claimETHPrize(addr2.address, INITIAL_AMOUNT, proof)
            ).to.be.revertedWith("Pausable: paused");

            await distributor.activateContract();
        });

        it("emits a ClaimETH event if claiming ETH tokens with a valid proof", async () => {
            const leaf = hashETHPrizeInputs([addr2.address, INITIAL_AMOUNT]);
            const proof = ethMerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr2)
                    .claimETHPrize(addr2.address, INITIAL_AMOUNT, proof)
            )
                .to.emit(distributor, "ClaimETH")
                .withArgs(addr2.address, INITIAL_AMOUNT);
        });

        it("emits a ClaimETH event of zero ETH tokens when claiming for the second time", async () => {
            const leaf = hashETHPrizeInputs([addr2.address, INITIAL_AMOUNT]);
            const proof = ethMerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr2)
                    .claimETHPrize(addr2.address, INITIAL_AMOUNT, proof)
            )
                .to.emit(distributor, "ClaimETH")
                .withArgs(addr2.address, 0);
        });

        it("emits a ClaimETH event when claiming after the merkle root is updated", async () => {
            ethMerkleTree = constructETHPrizeMerkleTree([
                [addr2.address, INITIAL_AMOUNT + EXTRA],
            ]);

            await distributor.setETHMerkleRoot(ethMerkleTree.getHexRoot());

            const leaf = hashETHPrizeInputs([
                addr2.address,
                INITIAL_AMOUNT + EXTRA,
            ]);
            const proof = ethMerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr2)
                    .claimETHPrize(addr2.address, INITIAL_AMOUNT + EXTRA, proof)
            )
                .to.emit(distributor, "ClaimETH")
                .withArgs(addr2.address, EXTRA);
        });

        it("emits a ClaimETH event of zero ETH tokens when claiming for a second time after the merkle root is updated", async () => {
            const leaf = hashETHPrizeInputs([
                addr2.address,
                INITIAL_AMOUNT + EXTRA,
            ]);
            const proof = ethMerkleTree.getHexProof(leaf);

            await expect(
                distributor
                    .connect(addr2)
                    .claimETHPrize(addr2.address, INITIAL_AMOUNT + EXTRA, proof)
            )
                .to.emit(distributor, "ClaimETH")
                .withArgs(addr2.address, 0);
        });
    });
});
