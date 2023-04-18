import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import * as Engine from "@simium/footium-engine";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
    deployProxyAndArtifact,
    getDivisionMintingFees,
    MINTER_ROLE,
} from "../scripts/helpers";
const divFeeMetadata = require("../scripts/divFeesMetadata.json");

const PLAYER_URI = "https://footium.club/test-20221006/api/nfts/players/";
const CLUB_URI = "https://footium.club/test-20221006/api/nfts/clubs/";
const ROYALTY_FEE_PERCENTAGE = 500; // 5%
const DIVISION_FEES = getDivisionMintingFees(divFeeMetadata);

console.log("DIVISION_FEES: ", DIVISION_FEES);

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const PrizeDistributor = await deployProxyAndArtifact(hre)(
        "FootiumPrizeDistributor"
    );
    console.log(
        "FootiumPrizeDistributor is successfully deployed, address: ",
        PrizeDistributor.address
    );

    await deployProxyAndArtifact(hre)("FootiumToken");
    console.log("FootiumToken is successfully deployed");

    const ClubContract = await deployProxyAndArtifact(hre)("FootiumClub", [
        CLUB_URI,
    ]);
    console.log(
        "ClubContract is successfully deployed, address: ",
        ClubContract.address
    );

    const FootiumGeneralPaymentContract = await deployProxyAndArtifact(hre)(
        "FootiumGeneralPaymentContract",
        [PrizeDistributor.address, ClubContract.address]
    );
    console.log(
        "FootiumGeneralPaymentContract is successfully deployed, address: ",
        FootiumGeneralPaymentContract.address
    );

    const PlayerContract = await deployProxyAndArtifact(hre)("FootiumPlayer", [
        PrizeDistributor.address,
        ROYALTY_FEE_PERCENTAGE,
        PLAYER_URI,
    ]);
    console.log(
        "PlayerContract is successfully deployed, address: ",
        PlayerContract.address
    );

    const ClubMinterContract = await deployProxyAndArtifact(hre)(
        "FootiumClubMinter",
        [PlayerContract.address, ClubContract.address]
    );
    console.log(
        "ClubMinterContract is successfully deployed, address: ",
        ClubMinterContract.address
    );

    const AcademyContract = await deployProxyAndArtifact(hre)(
        "FootiumAcademy",
        [
            PlayerContract.address,
            ClubContract.address,
            PrizeDistributor.address,
            Engine.Constants.ACADEMY_COHORT_SIZE,
            DIVISION_FEES,
        ]
    );
    console.log(
        "AcademyContract is successfully deployed, address: ",
        AcademyContract.address
    );

    await PlayerContract.grantRole(MINTER_ROLE, AcademyContract.address);

    await PlayerContract.grantRole(MINTER_ROLE, ClubMinterContract.address);

    await ClubContract.grantRole(MINTER_ROLE, ClubMinterContract.address);
};

export default func;
