import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployProxy, MINTER_ROLE } from "../scripts/helpers";

describe("General Payment Contract", function () {
    let paymentContract, distributor, clubs, owner, addr1, addr2;

    before(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();

        distributor = await deployProxy("FootiumPrizeDistributor");
        clubs = await deployProxy("FootiumClub", [""]);

        await clubs.grantRole(MINTER_ROLE, owner.address);
        await clubs.safeMint(addr1.address, 1);

        paymentContract = await deployProxy("FootiumGeneralPaymentContract", [
            distributor.address,
            clubs.address,
        ]);
    });

    context("Initializer", () => {
        it("storage variables are properly set on deployment", async () => {
            const footiumClub = await paymentContract.footiumClub();
            expect(footiumClub).to.equal(clubs.address);

            const paymentReceiverAddress =
                await paymentContract.paymentReceiverAddress();
            expect(paymentReceiverAddress).to.equal(distributor.address);
        });
    });

    context("Set Payment Receiver address", () => {
        it("should fail if caller is not the contract owner", async () => {
            const newReceiverAddress = addr2.address;

            await expect(
                paymentContract
                    .connect(addr1)
                    .setPaymentReceiverAddress(newReceiverAddress)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully update payment receiver address", async () => {
            const newReceiverAddress = addr2.address;

            await expect(
                paymentContract.setPaymentReceiverAddress(newReceiverAddress)
            )
                .to.emit(paymentContract, "PaymentReceiverUpdated")
                .withArgs(newReceiverAddress);

            const updatedReceiverAddress =
                await paymentContract.paymentReceiverAddress();
            await expect(updatedReceiverAddress).to.equal(newReceiverAddress);

            // revert the original receiver address
            await paymentContract.setPaymentReceiverAddress(
                distributor.address
            );
        });
    });

    context("Pausable", () => {
        it("should fail to pause the contract if caller is not the contract owner", async () => {
            await expect(
                paymentContract.connect(addr1).pauseContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully pause the contract", async () => {
            await expect(paymentContract.pauseContract())
                .to.emit(paymentContract, "Paused")
                .withArgs(owner.address);
        });
        it("should fail to activate the contract if caller is not the contract owner", async () => {
            await expect(
                paymentContract.connect(addr1).activateContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should successfully activate the contract", async () => {
            await expect(paymentContract.activateContract())
                .to.emit(paymentContract, "Unpaused")
                .withArgs(owner.address);
        });
    });

    context("Make Payment", () => {
        it("should fail if caller is not the club owner", async () => {
            const clubId = 1;
            const message = "stadium:medium:brick:north";

            await expect(
                paymentContract.connect(addr2).makePayment(clubId, message, {
                    value: ethers.utils.parseEther("0.1"),
                })
            )
                .to.be.revertedWithCustomError(paymentContract, "NotClubOwner")
                .withArgs(clubId, addr2.address);
        });
        it("should fail if ETH amount is incorrect", async () => {
            const clubId = 1;
            const message = "stadium:medium:brick:north";

            await expect(
                paymentContract.connect(addr1).makePayment(clubId, message)
            )
                .to.be.revertedWithCustomError(
                    paymentContract,
                    "IncorrectETHAmount"
                )
                .withArgs(0);
        });
        it("should fail if contract is paused", async () => {
            const clubId = 1;
            const message = "stadium:medium:brick:north";
            const ethAmount = ethers.utils.parseEther("0.1");

            await paymentContract.pauseContract();

            await expect(
                paymentContract.connect(addr1).makePayment(clubId, message, {
                    value: ethAmount,
                })
            ).to.be.revertedWith("Pausable: paused");

            await paymentContract.activateContract();
        });
        it("should successfully make a payment", async () => {
            const clubId = 1;
            const message = "stadium:medium:brick:north";
            const ethAmount = ethers.utils.parseEther("0.1");

            const receiverBalanceBefore = await ethers.provider.getBalance(
                distributor.address
            );

            await expect(
                paymentContract.connect(addr1).makePayment(clubId, message, {
                    value: ethAmount,
                })
            )
                .to.emit(paymentContract, "PaymentMade")
                .withArgs(clubId, ethAmount, message);

            const receiverBalanceAfter = await ethers.provider.getBalance(
                distributor.address
            );

            expect(
                receiverBalanceAfter.sub(receiverBalanceBefore).toString()
            ).to.equal(ethAmount.toString());
        });
    });
});
