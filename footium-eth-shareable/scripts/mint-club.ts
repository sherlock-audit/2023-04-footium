import { deployments, getNamedAccounts } from "hardhat";
const { execute } = deployments;

async function main() {
    const { deployer } = await getNamedAccounts();

    await execute(
        "FootiumClubMinter",
        { from: deployer, log: true },
        "mint",
        process.env.ACCOUNT,
        process.env.TOKEN_ID
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
