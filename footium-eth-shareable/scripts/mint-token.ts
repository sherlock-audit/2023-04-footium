import { deployments, getNamedAccounts } from "hardhat";
const { execute, get } = deployments;

const AMOUNT = "10000000000000000000000000";

async function main() {
    const { deployer } = await getNamedAccounts();

    const PrizeDistributorContract = await get("FootiumPrizeDistributor");

    await execute(
        "FootiumToken",
        { from: deployer, log: true },
        "mint",
        PrizeDistributorContract.address,
        AMOUNT
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
