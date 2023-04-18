import * as fs from "fs";
import * as R from "ramda";
import "@openzeppelin/hardhat-upgrades";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { randomBytes } from "crypto";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { MerkleTree } from "merkletreejs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
const keccak256 = require("keccak256");

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const MINTER_ROLE =
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";

export async function updateArtifact(
    name: string,
    address,
    chainId,
    transactionHash
) {
    const filename = `./artifacts/contracts/${name}.sol/${name}.json`;

    const rawData = fs.readFileSync(filename);

    const data = JSON.parse(rawData.toString());

    data.networks = data.networks || {};

    data.networks[chainId] = {
        events: {},
        links: {},
        address,
        transactionHash,
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, "  "));
}

const updateDeploymentArtifacts =
    (hre: HardhatRuntimeEnvironment) =>
    async (contractInstance: Contract, name: string) => {
        let deploymentsPath = "./deployments";

        if (!fs.existsSync(deploymentsPath)) {
            fs.mkdirSync(deploymentsPath);
        }

        deploymentsPath = `${deploymentsPath}/${hre.network.name}`;

        if (!fs.existsSync(deploymentsPath)) {
            fs.mkdirSync(deploymentsPath);
        }

        const chainIdPath = `${deploymentsPath}/.chainId`;

        const deployment = await hre.artifacts.readArtifact(name);

        const chainId = await hre.getChainId();

        fs.writeFileSync(chainIdPath, chainId);

        const artifact = {
            contractName: deployment.contractName,
            abi: deployment.abi,
            bytecode: deployment.bytecode,
            deployedBytecode: deployment.deployedBytecode,
            address: contractInstance.address,
            transactionHash: deployment.networks[chainId].transactionHash,
        };

        const filename = `${deploymentsPath}/${name}.json`;

        fs.writeFileSync(filename, JSON.stringify(artifact, null, "  "));
    };

export async function deploy(name: string, ...params) {
    let contractFactory = await ethers.getContractFactory(name);

    if (process.env.HARDWARE_WALLET) {
        const ledger = await new LedgerSigner(
            ethers.provider,
            "hid",
            "44'/60'/1'/0/0"
        );

        contractFactory = await contractFactory.connect(ledger);
    }

    const contract = await contractFactory
        .deploy(...params)
        .then((f) => f.deployed());

    updateArtifact(
        name,
        contract.address,
        contract.deployTransaction.chainId,
        contract.deployTransaction.hash
    );

    return contract;
}

export async function deployProxy(
    name: string,
    args: any[] = []
): Promise<Contract> {
    const contractFactory = await ethers.getContractFactory(name);
    const instance = await upgrades.deployProxy(contractFactory, args);

    await instance.deployed();

    return instance;
}

export const deployProxyAndArtifact =
    (hre: HardhatRuntimeEnvironment) =>
    async (name: string, args: any[] = []) => {
        const contractFactory = await ethers.getContractFactory(name);
        const instance = await upgrades.deployProxy(contractFactory, args);

        await instance.deployed();

        await updateArtifact(
            name,
            instance.address,
            instance.deployTransaction.chainId,
            instance.deployTransaction.hash
        );

        await updateDeploymentArtifacts(hre)(instance, name);

        return instance;
    };

export async function upgradeProxy(
    address: string,
    name: string
): Promise<Contract> {
    const contractFactory = await ethers.getContractFactory(name);
    return upgrades.upgradeProxy(address, contractFactory);
}

export const constructMerkleTree = (hashes) => {
    return new MerkleTree(hashes, keccak256, {
        sortPairs: true,
    });
};

export const constructDivsMerkleTree = (whitelist: any[]) =>
    constructMerkleTree(whitelist.map((w) => hashClubDivisionInputs(w)));

export const hashClubDivisionInputs = (l: any[]) => {
    return Buffer.from(
        ethers.utils.solidityKeccak256(["uint256", "uint256"], l).slice(2),
        "hex"
    );
};

export const hashERC20PrizeInputs = (l: any[]) => {
    return Buffer.from(
        ethers.utils
            .solidityKeccak256(["address", "address", "uint256"], l)
            .slice(2),
        "hex"
    );
};

export const hashETHPrizeInputs = (l: any[]) => {
    return Buffer.from(
        ethers.utils.solidityKeccak256(["address", "uint256"], l).slice(2),
        "hex"
    );
};

export const constructERC20PrizeMerkleTree = (whitelist: any[]) =>
    constructMerkleTree(whitelist.map((w) => hashERC20PrizeInputs(w)));

export const constructETHPrizeMerkleTree = (whitelist: any[]) =>
    constructMerkleTree(whitelist.map((w) => hashETHPrizeInputs(w)));

export const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

//Constructing leaves for the divfees merkle root
export function HashToken(input_1, input_2) {
    return Buffer.from(
        ethers.utils
            .solidityKeccak256(["uint256", "uint256"], [input_1, input_2])
            .slice(2),
        "hex"
    );
}

export function leaf(input) {
    return Object.entries(input).map((token) => HashToken(...token));
}

export function testingHashToken(metadataString) {
    return ethers.utils.solidityKeccak256(["string"], [metadataString]);
}

export function metadataHashToken(metadataString) {
    return Buffer.from(
        ethers.utils.solidityKeccak256(["string"], [metadataString]).slice(2),
        "hex"
    );
}

export function getRandomBytes32() {
    const buf = randomBytes(32);
    return `0x${buf.toString("hex")}`;
}

export function getDivisionMintingFees(
    divFeeMetadata: Array<{ divisionTier: number; mintingFee: number }>
) {
    return R.sortBy(R.prop("divisionTier"))(divFeeMetadata).map((data) =>
        ethers.utils.parseEther(data.mintingFee.toString()).toString()
    );
}
