import fs from "fs";
import { deployments, getNamedAccounts } from "hardhat";
import { sleep } from "./helpers";

const { execute } = deployments;

const footiumConfig = JSON.parse(fs.readFileSync("../../config.json", "utf8"));

async function main() {
    const { deployer } = await getNamedAccounts();

    const owners = {};
    footiumConfig.initialActions
        .filter((a) => a.type === "CLUB_TRANSFER" || a.type === "CLUB_CREATED")
        .forEach((a) => (owners[a.data.clubId] = a.data.addressTo || deployer));
    console.log(owners);

    for (let i = 1; i <= 3060; i++) {
        if (owners[i]) {
            try {
                console.log("Minted club ID: ", i, "owner is", deployer);
                await execute(
                    "FootiumClubMinter",
                    { from: deployer, log: true },
                    "mint",
                    owners[i],
                    i
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
