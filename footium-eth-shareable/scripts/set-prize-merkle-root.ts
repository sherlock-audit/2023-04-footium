import { deployments, getNamedAccounts } from "hardhat";
const { execute } = deployments;

async function main() {
    const { deployer } = await getNamedAccounts();

    const root = process.env.ROOT;

    await execute(
        "FootiumPrizeDistributor",
        { from: deployer, log: true },
        "setMerkleRoot",
        root
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
