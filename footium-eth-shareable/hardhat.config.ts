import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-deploy";
import "solidity-coverage";

const settings = {
    optimizer: {
        enabled: true,
        runs: 200,
    },
};

const config: HardhatUserConfig = {
    solidity: {
        compilers: [{ version: "0.8.16", settings }],
    },
    namedAccounts: {
        deployer: 0,
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        goerli: {
            url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
            accounts: process.env.TEST_ETH_KEY
                ? [`0x${process.env.TEST_ETH_KEY}`]
                : [],
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

module.exports = config;
