import fs from "fs";
import { deployments, getNamedAccounts } from "hardhat";
import { ethers } from "hardhat";
import { sleep } from "./helpers";

const { execute, read } = deployments;

const UNITS = ethers.BigNumber.from("10").pow("18");
const TOKENS_TO_MINT = ethers.BigNumber.from("10000").mul(UNITS);

const footiumConfig = JSON.parse(fs.readFileSync("config.json", "utf8"));

async function main() {
    const { deployer } = await getNamedAccounts();

    const owners = {};
    footiumConfig.initialActions
        .filter((a) => a.type === "CLUB_TRANSFER")
        .forEach((a) => (owners[a.clubId] = a.addressTo));

    for (let i = 1; i <= 3060; i++) {
        if (owners[i]) {
            try {
                const escrowAddress = await read(
                    "FootiumClub",
                    "clubToEscrow",
                    i
                );
                await sleep(10);
                await execute(
                    "FootiumToken",
                    { from: deployer, log: true },
                    "mint",
                    escrowAddress,
                    TOKENS_TO_MINT
                );
                await sleep(10);
            } catch (error) {
                console.log(error);
            }
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
